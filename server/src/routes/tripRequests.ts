import { type RequestHandler, Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { KosherPreference, type TripStatus } from "../generated/prisma/enums.js";
import {
    canTransition,
    ITINERARY_EDITABLE_STATUSES,
    statusesThatCanMoveTo,
} from "../lib/tripStatus.js";
import { itineraryDaysInclude } from "../lib/itinerary.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

// Today's date (YYYY-MM-DD) in Israel, where our travelers book from.
function todayInIsrael(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(
        new Date(),
    );
}

const createTripRequestSchema = z
    .object({
        startDate: z.iso.date(),
        endDate: z.iso.date(),
        travelersCount: z.int().min(1).max(50),
        budgetMin: z.int().min(0).max(10_000_000).optional(),
        budgetMax: z.int().min(0).max(10_000_000).optional(),
        kosher: z.enum(KosherPreference).default("NONE"),
        needsFlights: z.boolean().default(false),
        needsHotels: z.boolean().default(false),
        needsCarRental: z.boolean().default(false),
        needsFullPackage: z.boolean().default(false),
        description: z.string().trim().min(10).max(5000),
    })
    // A full package always includes flights and lodging.
    .transform((data) =>
        data.needsFullPackage
            ? { ...data, needsFlights: true, needsHotels: true }
            : data,
    )
    .refine((data) => data.startDate >= todayInIsrael(), {
        message: "Start date cannot be in the past",
        path: ["startDate"],
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: "End date must be on or after the start date",
        path: ["endDate"],
    })
    .refine(
        (data) =>
            data.budgetMin === undefined ||
            data.budgetMax === undefined ||
            data.budgetMax >= data.budgetMin,
        {
            message: "Maximum budget must be at least the minimum budget",
            path: ["budgetMax"],
        },
    );

export const tripRequestsRouter = Router();

tripRequestsRouter.use(requireAuth);

tripRequestsRouter.post("/", requireRole("TRAVELER"), async (req, res) => {
    const parsed = createTripRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid input",
            details: z.flattenError(parsed.error),
        });
        return;
    }

    const { startDate, endDate, budgetMin, budgetMax, ...rest } = parsed.data;
    const tripRequest = await prisma.tripRequest.create({
        data: {
            ...rest,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            budgetMin: budgetMin ?? null,
            budgetMax: budgetMax ?? null,
            travelerId: req.user!.id,
        },
    });

    res.status(201).json({ tripRequest });
});

tripRequestsRouter.get("/", async (req, res) => {
    const tripRequests = await prisma.tripRequest.findMany({
        where: { travelerId: req.user!.id },
        orderBy: { createdAt: "desc" },
    });

    res.json({ tripRequests });
});

// One of my trip requests, with the itinerary once the guide has sent it.
tripRequestsRouter.get("/:id", async (req, res) => {
    const tripRequest = await prisma.tripRequest.findFirst({
        where: { id: req.params.id, travelerId: req.user!.id },
        include: {
            guide: { select: { name: true, phone: true } },
            itineraryDays: itineraryDaysInclude,
        },
    });
    if (!tripRequest) {
        res.status(404).json({ error: "Trip request not found" });
        return;
    }

    // While the guide is working on it, the itinerary is a draft: don't show it.
    if (ITINERARY_EDITABLE_STATUSES.includes(tripRequest.status)) {
        tripRequest.itineraryDays = [];
    }

    res.json({ tripRequest });
});

const requestChangesSchema = z.object({
    note: z.string().trim().min(1).max(2000),
});

// Builds a route that moves one of my trips to status `to`.
function travelerTransition(
    to: TripStatus,
    extraData: (body: unknown) => Prisma.TripRequestUpdateManyMutationInput = () => ({}),
): RequestHandler<{ id: string }> {
    return async (req, res) => {
        const travelerId = req.user!.id;
        const id = req.params.id;

        const trip = await prisma.tripRequest.findFirst({ where: { id, travelerId } });
        if (!trip) {
            res.status(404).json({ error: "Trip request not found" });
            return;
        }
        if (!canTransition(trip.status, to)) {
            res.status(409).json({ error: `Cannot move from ${trip.status} to ${to}` });
            return;
        }

        const moved = await prisma.tripRequest.updateMany({
            where: { id, travelerId, status: { in: statusesThatCanMoveTo(to) } },
            data: { status: to, ...extraData(req.body) },
        });
        if (moved.count === 0) {
            res.status(409).json({ error: "Trip request changed, please reload" });
            return;
        }

        const tripRequest = await prisma.tripRequest.findUnique({ where: { id } });
        res.json({ tripRequest });
    };
}

tripRequestsRouter.post("/:id/confirm", requireRole("TRAVELER"), travelerTransition("CONFIRMED"));
// The traveler must say what to change, so the guide knows what to fix.
tripRequestsRouter.post(
    "/:id/request-changes",
    requireRole("TRAVELER"),
    (req, res, next) => {
        const parsed = requestChangesSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Invalid input",
                details: z.flattenError(parsed.error),
            });
            return;
        }
        req.body = parsed.data;
        next();
    },
    travelerTransition("IN_REVISION", (body) => ({
        revisionNote: (body as z.infer<typeof requestChangesSchema>).note,
    })),
);
tripRequestsRouter.post(
    "/:id/cancel",
    requireRole("TRAVELER"),
    travelerTransition("CANCELLED", () => ({ cancelledAt: new Date() })),
);
