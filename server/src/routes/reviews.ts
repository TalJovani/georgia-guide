import { type RequestHandler, Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import type { TripStatus } from "../generated/prisma/enums.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

// A trip can be reviewed once it's over: travelled, or cancelled (the guide's handling still counts).
const REVIEWABLE_STATUSES: readonly TripStatus[] = ["COMPLETED", "CANCELLED"];

const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().max(2000).optional(),
    tripRequestId: z.string().optional(),
});

// What anyone may see of a review. No email, phone or user ids: this is public.
const publicReviewSelect = {
    id: true,
    rating: true,
    text: true,
    createdAt: true,
    author: { select: { name: true } },
    tripRequest: { select: { status: true } },
} satisfies Prisma.ReviewSelect;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof publicReviewSelect }>;

function toPublicReview({ author, tripRequest, ...review }: ReviewRow) {
    return {
        ...review,
        authorName: author.name,
        // Only someone who really travelled gets the "verified trip" tag.
        verifiedTrip: tripRequest?.status === "COMPLETED",
    };
}

export const reviewsRouter = Router();

// Public: every review the guide didn't hide, newest first, with the average rating.
reviewsRouter.get("/", async (_req, res) => {
    const visible = { hiddenAt: null };
    const [reviews, stats] = await Promise.all([
        prisma.review.findMany({
            where: visible,
            orderBy: { createdAt: "desc" },
            select: publicReviewSelect,
        }),
        prisma.review.aggregate({ where: visible, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    res.json({
        reviews: reviews.map(toPublicReview),
        average: stats._avg.rating,
        count: stats._count._all,
    });
});

// What I already reviewed, so the client knows where to offer the review form.
reviewsRouter.get("/mine", requireAuth, async (req, res) => {
    const mine = await prisma.review.findMany({
        where: { authorId: req.user!.id },
        select: { tripRequestId: true },
    });

    res.json({
        hasGeneralReview: mine.some((r) => r.tripRequestId === null),
        reviewedTripIds: mine.flatMap((r) => (r.tripRequestId ? [r.tripRequestId] : [])),
    });
});

reviewsRouter.post("/", requireAuth, requireRole("TRAVELER"), async (req, res) => {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: z.flattenError(parsed.error) });
        return;
    }
    const { rating, tripRequestId } = parsed.data;
    const text = parsed.data.text || null;
    const authorId = req.user!.id;

    if (tripRequestId) {
        const trip = await prisma.tripRequest.findFirst({
            where: { id: tripRequestId, travelerId: authorId },
            select: { status: true },
        });
        if (!trip) {
            res.status(404).json({ error: "Trip request not found" });
            return;
        }
        if (!REVIEWABLE_STATUSES.includes(trip.status)) {
            res.status(409).json({ error: "The trip is not over yet" });
            return;
        }
    } else {
        // One general review per traveler. (One per trip is kept by the database: @unique.)
        const general = await prisma.review.count({ where: { authorId, tripRequestId: null } });
        if (general > 0) {
            res.status(409).json({ error: "You already wrote a general review" });
            return;
        }
    }

    try {
        const review = await prisma.review.create({
            data: { rating, text, authorId, tripRequestId: tripRequestId ?? null },
            select: publicReviewSelect,
        });
        res.status(201).json({ review: toPublicReview(review) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ error: "This trip already has a review" });
            return;
        }
        throw error;
    }
});

// For guides: all reviews, hidden ones too, and hiding / un-hiding offensive ones.
export const guideReviewsRouter = Router();

guideReviewsRouter.use(requireAuth, requireRole("GUIDE"));

guideReviewsRouter.get("/", async (_req, res) => {
    const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        select: { ...publicReviewSelect, hiddenAt: true },
    });

    res.json({
        reviews: reviews.map(({ hiddenAt, ...review }) => ({ ...toPublicReview(review), hiddenAt })),
    });
});

// Builds the route that hides (or shows again) one review. Hidden reviews are kept, not deleted.
function setHidden(hidden: boolean): RequestHandler<{ id: string }> {
    return async (req, res) => {
        const updated = await prisma.review.updateMany({
            where: { id: req.params.id },
            data: { hiddenAt: hidden ? new Date() : null },
        });
        if (updated.count === 0) {
            res.status(404).json({ error: "Review not found" });
            return;
        }
        res.status(204).end();
    };
}

guideReviewsRouter.post("/:id/hide", setHidden(true));
guideReviewsRouter.post("/:id/unhide", setHidden(false));
