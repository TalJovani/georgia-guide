import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const guideRouter = Router();

guideRouter.use(requireAuth, requireRole("GUIDE"));

// Requests assigned to this guide, plus new ones nobody has picked up yet.
guideRouter.get("/trip-requests", async (req, res) => {
    const tripRequests = await prisma.tripRequest.findMany({
        where: { OR: [{ guideId: req.user!.id }, { guideId: null }] },
        orderBy: { createdAt: "desc" },
        include: {
            traveler: { select: { name: true, email: true, phone: true } },
        },
    });

    res.json({ tripRequests });
});
