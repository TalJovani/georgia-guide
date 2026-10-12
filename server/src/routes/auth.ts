import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8).max(72),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).optional(),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid input",
            details: z.flattenError(parsed.error),
        });
        return;
    }

    const { email, password, name, phone } = parsed.data;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
        const user = await prisma.user.create({
            data: { email, passwordHash, name, phone: phone ?? null },
            select: { id: true, email: true, name: true, role: true },
        });
        res.status(201).json({ user });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            res.status(409).json({ error: "Email is already registered" });
            return;
        }
        throw error;
    }
});
