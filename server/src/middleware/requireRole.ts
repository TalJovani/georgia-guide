import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/enums.js";

// Use after requireAuth: router.use(requireAuth, requireRole("GUIDE"))
export function requireRole(...allowed: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !allowed.includes(req.user.role)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        next();
    };
}
