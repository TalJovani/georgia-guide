import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { vapidPublicKey } from "../lib/push.js";
import { requireAuth } from "../middleware/requireAuth.js";

// What the browser's pushManager.subscribe() gives, as JSON.
const subscriptionSchema = z.object({
    endpoint: z.url(),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export const pushRouter = Router();

pushRouter.use(requireAuth);

// The browser needs our public key to subscribe. 503 = push isn't set up on this server.
pushRouter.get("/public-key", (_req, res) => {
    if (!vapidPublicKey) {
        res.status(503).json({ error: "Push is not configured" });
        return;
    }
    res.json({ publicKey: vapidPublicKey });
});

// Save this browser's subscription for the signed-in user. The same browser subscribing
// again (or someone else signing in on it) updates the row instead of adding one.
pushRouter.post("/subscriptions", async (req, res) => {
    const parsed = subscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: z.flattenError(parsed.error) });
        return;
    }
    const { endpoint, keys } = parsed.data;
    const data = { userId: req.user!.id, p256dh: keys.p256dh, auth: keys.auth };
    await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: { endpoint, ...data },
        update: data,
    });
    res.status(204).end();
});

// Stop pushing to this browser.
pushRouter.delete("/subscriptions", async (req, res) => {
    const parsed = z.object({ endpoint: z.url() }).safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: z.flattenError(parsed.error) });
        return;
    }
    await prisma.pushSubscription.deleteMany({
        where: { endpoint: parsed.data.endpoint, userId: req.user!.id },
    });
    res.status(204).end();
});
