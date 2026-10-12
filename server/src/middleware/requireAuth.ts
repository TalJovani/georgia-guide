import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { AUTH_COOKIE, authCookieOptions, verifySessionToken } from "../lib/session.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token: unknown = req.cookies[AUTH_COOKIE];
    const userId = typeof token === "string" ? verifySessionToken(token) : null;

    const user = userId
        ? await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, role: true },
          })
        : null;

    if (!user) {
        if (userId) {
            // Valid token for an account that no longer exists.
            res.clearCookie(AUTH_COOKIE, authCookieOptions);
        }
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    req.user = user;
    next();
}
