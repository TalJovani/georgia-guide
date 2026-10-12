import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, verifySessionToken } from "../lib/session.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token: unknown = req.cookies[AUTH_COOKIE];
    const user = typeof token === "string" ? verifySessionToken(token) : null;

    if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    req.user = user;
    next();
}
