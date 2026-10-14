import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import {
    canTransition,
    ITINERARY_EDITABLE_STATUSES,
    statusesThatCanMoveTo,
} from "../lib/tripStatus.js";
import { itineraryDaysInclude } from "../lib/itinerary.js";
import { isTripSummaryEnabled, summarizeTripRequest } from "../lib/tripSummary.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 24-hour "HH:MM", zero-padded so that comparing the text compares the time.
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

const activitySchema = z
    .object({
        startTime: timeSchema,
        endTime: timeSchema,
        title: z.string().trim().min(1).max(200),
        details: z.string().trim().max(2000).optional(),
    })
    .refine((a) => a.endTime > a.startTime, {
        message: "End time must be after start time",
        path: ["endTime"],
    });

const saveItinerarySchema = z
    .object({
        days: z
            .array(
                z.object({
                    dayNumber: z.int().min(1),
                    title: z.string().trim().min(1).max(200),
                    activities: z.array(activitySchema).max(30).default([]),
                }),
            )
            .max(60),
    })
    .refine(
        (data) => new Set(data.days.map((d) => d.dayNumber)).size === data.days.length,
        { message: "Each day number may appear only once", path: ["days"] },
    );

// Trips this guide may see: assigned to them, or not picked up by anyone yet.
function visibleToGuide(guideId: string) {
    return { OR: [{ guideId }, { guideId: null }] };
}

export const guideRouter = Router();

guideRouter.use(requireAuth, requireRole("GUIDE"));

guideRouter.get("/trip-requests", async (req, res) => {
    const tripRequests = await prisma.tripRequest.findMany({
        where: visibleToGuide(req.user!.id),
        orderBy: { createdAt: "desc" },
        include: {
            traveler: { select: { name: true, email: true, phone: true } },
        },
    });

    res.json({ tripRequests });
});

// One trip request with its itinerary.
guideRouter.get("/trip-requests/:id", async (req, res) => {
    const tripRequest = await prisma.tripRequest.findFirst({
        where: { id: req.params.id, ...visibleToGuide(req.user!.id) },
        include: {
            traveler: { select: { name: true, email: true, phone: true } },
            itineraryDays: itineraryDaysInclude,
        },
    });
    if (!tripRequest) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }

    res.json({ tripRequest });
});

// Make (or remake) the AI summary, for trips whose summary is missing.
guideRouter.post("/trip-requests/:id/summary", async (req, res) => {
    if (!isTripSummaryEnabled) {
        res.status(503).json({ error: "AI summary is not configured" });
        return;
    }
    const trip = await prisma.tripRequest.findFirst({
        where: { id: req.params.id, ...visibleToGuide(req.user!.id) },
        select: { id: true },
    });
    if (!trip) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }

    const summary = await summarizeTripRequest(trip.id);
    if (!summary) {
        res.status(502).json({ error: "Could not make a summary, try again later" });
        return;
    }

    res.json(summary);
});

// Replace the whole itinerary. Saving it also assigns the trip to this guide.
guideRouter.put("/trip-requests/:id/itinerary", async (req, res) => {
    const parsed = saveItinerarySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid input",
            details: z.flattenError(parsed.error),
        });
        return;
    }
    const { days } = parsed.data;
    const guideId = req.user!.id;
    const tripRequestId = req.params.id;

    const trip = await prisma.tripRequest.findFirst({
        where: { id: tripRequestId, ...visibleToGuide(guideId) },
    });
    if (!trip) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }
    if (!ITINERARY_EDITABLE_STATUSES.includes(trip.status)) {
        res.status(409).json({ error: "Itinerary cannot be edited in this status" });
        return;
    }

    const tripLength = (trip.endDate.getTime() - trip.startDate.getTime()) / MS_PER_DAY + 1;
    if (days.some((d) => d.dayNumber > tripLength)) {
        res.status(400).json({ error: `The trip has only ${tripLength} days` });
        return;
    }

    const itineraryDays = await prisma.$transaction(async (tx) => {
        // Re-check status and owner in the same statement that claims the trip,
        // in case something changed since we read it above.
        const claimed = await tx.tripRequest.updateMany({
            where: {
                id: tripRequestId,
                status: { in: [...ITINERARY_EDITABLE_STATUSES] },
                ...visibleToGuide(guideId),
            },
            data: { guideId },
        });
        if (claimed.count === 0) return null;

        // Deleting the days also deletes their activities (onDelete: Cascade).
        await tx.itineraryDay.deleteMany({ where: { tripRequestId } });
        for (const day of days) {
            await tx.itineraryDay.create({
                data: {
                    tripRequestId,
                    dayNumber: day.dayNumber,
                    title: day.title,
                    activities: {
                        create: day.activities.map((a) => ({ ...a, details: a.details ?? null })),
                    },
                },
            });
        }
        return tx.itineraryDay.findMany({ where: { tripRequestId }, ...itineraryDaysInclude });
    });
    if (!itineraryDays) {
        res.status(409).json({ error: "Trip request changed, please reload" });
        return;
    }

    res.json({ itineraryDays });
});

// Send the itinerary to the traveler: NEW / IN_REVISION -> ITINERARY_SENT.
guideRouter.post("/trip-requests/:id/send", async (req, res) => {
    const guideId = req.user!.id;
    const tripRequestId = req.params.id;

    // Only the guide who saved the itinerary (and so was assigned) may send it.
    const trip = await prisma.tripRequest.findFirst({
        where: { id: tripRequestId, guideId },
        include: { _count: { select: { itineraryDays: true } } },
    });
    if (!trip) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }
    if (!canTransition(trip.status, "ITINERARY_SENT")) {
        res.status(409).json({ error: `Cannot send an itinerary from status ${trip.status}` });
        return;
    }
    if (trip._count.itineraryDays === 0) {
        res.status(400).json({ error: "Add at least one day before sending" });
        return;
    }

    // The status filter makes the move atomic: if two requests race,
    // only one of them finds the trip still in an allowed status.
    const moved = await prisma.tripRequest.updateMany({
        where: {
            id: tripRequestId,
            guideId,
            status: { in: statusesThatCanMoveTo("ITINERARY_SENT") },
        },
        data: { status: "ITINERARY_SENT" },
    });
    if (moved.count === 0) {
        res.status(409).json({ error: "Trip request changed, please reload" });
        return;
    }

    res.json({ status: "ITINERARY_SENT" });
});
