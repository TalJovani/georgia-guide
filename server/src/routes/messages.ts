import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { TripStatus } from "../generated/prisma/enums.js";
import type { SessionUser } from "../lib/session.js";
import { advanceTripsByDate } from "../lib/tripCalendar.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { visibleToGuide } from "./guide.js";

// Once a trip is over or cancelled, its chat stays readable but nobody can write in it.
const CHAT_LOCKED_STATUSES: readonly TripStatus[] = ["COMPLETED", "CANCELLED"];

const sendMessageSchema = z.object({
    body: z.string().trim().min(1).max(2000),
});

// The trip's chat is between its traveler and its guide. Before a guide has
// picked the trip up, any guide who can see it may read and answer.
function chatParticipant(user: SessionUser) {
    return user.role === "GUIDE" ? visibleToGuide(user.id) : { travelerId: user.id };
}

// Mounted under /api/messages: things about all of my chats at once.
export const allChatsRouter = Router();

allChatsRouter.use(requireAuth);

// How many messages the other side sent me that I haven't read yet, per trip: { [tripId]: count }.
// Trips with nothing unread are left out.
allChatsRouter.get("/unread", async (req, res) => {
    const user = req.user!;
    const groups = await prisma.message.groupBy({
        by: ["tripRequestId"],
        where: { tripRequest: chatParticipant(user), senderId: { not: user.id }, readAt: null },
        _count: { _all: true },
    });

    res.json({
        unread: Object.fromEntries(groups.map((g) => [g.tripRequestId, g._count._all])),
    });
});

// Mounted under /api/trip-requests/:id/messages, so `:id` comes from the parent path.
export const messagesRouter = Router({ mergeParams: true });

messagesRouter.use(requireAuth);

// The whole chat of one trip, oldest first, with what the chat page shows at the top.
// Opening it marks the other side's messages as read.
messagesRouter.get<{ id: string }>("/", async (req, res) => {
    const user = req.user!;
    const where = { id: req.params.id, ...chatParticipant(user) };
    await advanceTripsByDate(where);
    const trip = await prisma.tripRequest.findFirst({
        where,
        select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            traveler: { select: { name: true } },
            guide: { select: { name: true } },
        },
    });
    if (!trip) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }

    await prisma.message.updateMany({
        where: { tripRequestId: trip.id, senderId: { not: user.id }, readAt: null },
        data: { readAt: new Date() },
    });
    const messages = await prisma.message.findMany({
        where: { tripRequestId: trip.id },
        orderBy: { createdAt: "asc" },
    });

    res.json({
        trip,
        messages: messages.map(({ senderId, ...message }) => ({
            ...message,
            fromMe: senderId === user.id,
        })),
        locked: CHAT_LOCKED_STATUSES.includes(trip.status),
    });
});

messagesRouter.post<{ id: string }>("/", async (req, res) => {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid input",
            details: z.flattenError(parsed.error),
        });
        return;
    }
    const user = req.user!;
    const where = { id: req.params.id, ...chatParticipant(user) };
    await advanceTripsByDate(where);
    const trip = await prisma.tripRequest.findFirst({ where, select: { id: true, status: true } });
    if (!trip) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }
    if (CHAT_LOCKED_STATUSES.includes(trip.status)) {
        res.status(409).json({ error: "The chat of this trip is closed" });
        return;
    }

    const message = await prisma.$transaction(async (tx) => {
        if (user.role === "GUIDE") {
            // Answering the traveler picks the trip up, like saving an itinerary does.
            // Re-checked in the same statement, in case another guide picked it up meanwhile.
            const claimed = await tx.tripRequest.updateMany({
                where: { ...where, status: { notIn: [...CHAT_LOCKED_STATUSES] } },
                data: { guideId: user.id },
            });
            if (claimed.count === 0) return null;
        }
        return tx.message.create({
            data: { tripRequestId: trip.id, senderId: user.id, body: parsed.data.body },
        });
    });
    if (!message) {
        res.status(409).json({ error: "Trip request changed, please reload" });
        return;
    }

    const { senderId: _senderId, ...rest } = message;
    res.status(201).json({ message: { ...rest, fromMe: true } });
});
