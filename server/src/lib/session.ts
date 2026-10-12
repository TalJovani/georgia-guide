import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { UserRole } from "../generated/prisma/enums.js";

const SESSION_DAYS = 7;
const JWT_ALGORITHM = "HS256";

export const AUTH_COOKIE = "token";

export const authCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
};

export type SessionUser = {
    id: string;
    role: UserRole;
};

const tokenPayloadSchema = z.object({
    sub: z.string(),
    role: z.enum(UserRole),
});

export function signSessionToken(user: SessionUser): string {
    return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
        algorithm: JWT_ALGORITHM,
        expiresIn: `${SESSION_DAYS}d`,
    });
}

export function sessionCookieMaxAge(): number {
    return SESSION_DAYS * 24 * 60 * 60 * 1000;
}

// Returns the user from a valid token, or null if the token is missing,
// expired, forged, or has an unexpected shape.
export function verifySessionToken(token: string): SessionUser | null {
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            algorithms: [JWT_ALGORITHM],
        });
        const payload = tokenPayloadSchema.parse(decoded);
        return { id: payload.sub, role: payload.role };
    } catch {
        return null;
    }
}
