import webpush from "web-push";
import { prisma } from "../db.js";

// Web Push: the server sends a notification to a browser through that browser's push
// service, even when the site is closed. The VAPID keys prove the message comes from us:
// the public key is shared with browsers, the private key never leaves the server.
// Without the keys in .env the feature is off, and the in-page notifications still work.
const publicKey = process.env.VAPID_PUBLIC_KEY || null;
const privateKey = process.env.VAPID_PRIVATE_KEY || null;
const subject = process.env.VAPID_SUBJECT || null;

export const vapidPublicKey = publicKey && privateKey && subject ? publicKey : null;
if (vapidPublicKey) {
    webpush.setVapidDetails(subject!, publicKey!, privateKey!);
}

export type PushPayload = {
    title: string;
    body: string;
    // The page to open when the notification is clicked.
    url: string;
    // Notifications with the same tag replace each other (one per trip chat).
    tag: string;
};

// Push the same notification to every browser where these users turned push on.
// Never throws: a notification that didn't go out must not break sending a message.
export async function pushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!vapidPublicKey || userIds.length === 0) return;

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
    });
    await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify(payload),
                    // Keep it a day if the device is offline; chat messages deserve "high".
                    { TTL: 24 * 60 * 60, urgency: "high" },
                );
            } catch (err) {
                // 404 / 410: the browser dropped this subscription (push turned off,
                // site data cleared). It will never work again, so forget it.
                if (err instanceof webpush.WebPushError && [404, 410].includes(err.statusCode)) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                } else {
                    console.error("Push notification failed:", err);
                }
            }
        }),
    );
}
