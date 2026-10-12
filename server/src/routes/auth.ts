import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import {
    AUTH_COOKIE,
    authCookieOptions,
    sessionCookieMaxAge,
    signSessionToken,
} from "../lib/session.js";
import {
    BCRYPT_ROUNDS,
    currentPasswordField,
    emailField,
    hashPassword,
    nameField,
    newPasswordField,
    phoneField,
    publicUserSelect,
} from "../lib/userFields.js";
import { requireAuth } from "../middleware/requireAuth.js";

// Compared against when the email doesn't exist, so a failed login
// takes the same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

const registerSchema = z.object({
    email: emailField,
    password: newPasswordField,
    name: nameField,
    phone: phoneField.optional(),
});

const loginSchema = z.object({
    email: emailField,
    password: currentPasswordField,
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
    const passwordHash = await hashPassword(password);

    try {
        const user = await prisma.user.create({
            data: { email, passwordHash, name, phone: phone || null },
            select: publicUserSelect,
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

    const token = signSessionToken(user.id);
    res.cookie(AUTH_COOKIE, token, {
        ...authCookieOptions,
        maxAge: sessionCookieMaxAge(),
    });

    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
        },
    });
});

authRouter.get("/me", requireAuth, async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: req.user!.id },
        select: publicUserSelect,
    });

    res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE, authCookieOptions);
    res.status(204).end();
});
