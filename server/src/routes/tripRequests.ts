import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { KosherPreference } from "../generated/prisma/enums.js";
import { requireAuth } from "../middleware/requireAuth.js";

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

tripRequestsRouter.post("/", async (req, res) => {
    if (req.user!.role !== "TRAVELER") {
        res.status(403).json({ error: "Only travelers can create trip requests" });
        return;
    }

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
