import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import type { UserRole } from "../generated/prisma/enums.js";

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

// The token only says WHO the user is. What they may do (their role) is
// read fresh from the database on every request, so a role change or a
// deleted account takes effect immediately instead of after the token expires.
const tokenPayloadSchema = z.object({
    sub: z.string(),
});

export function signSessionToken(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwtSecret, {
        algorithm: JWT_ALGORITHM,
        expiresIn: `${SESSION_DAYS}d`,
    });
}

export function sessionCookieMaxAge(): number {
    return SESSION_DAYS * 24 * 60 * 60 * 1000;
}

// Returns the user id from a valid token, or null if the token is missing,
// expired, forged, or has an unexpected shape.
export function verifySessionToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            algorithms: [JWT_ALGORITHM],
        });
        return tokenPayloadSchema.parse(decoded).sub;
    } catch {
        return null;
    }
}
