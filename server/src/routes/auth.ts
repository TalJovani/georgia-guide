import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";

const BCRYPT_ROUNDS = 12;
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
export const AUTH_COOKIE = "token";

// Compared against when the email doesn't exist, so a failed login
// takes the same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

const emailField = z.string().trim().toLowerCase().pipe(z.email());

const registerSchema = z.object({
    email: emailField,
    password: z.string().min(8).max(72),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).optional(),
});

const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1).max(72),
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

authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid input",
            details: z.flattenError(parsed.error),
        });
        return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    const passwordMatches = await bcrypt.compare(
        password,
        user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
        algorithm: "HS256",
        expiresIn: `${SESSION_DAYS}d`,
    });

    res.cookie(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: SESSION_MS,
        path: "/",
    });

    res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
});
