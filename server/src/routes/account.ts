import bcrypt from "bcryptjs";
import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import { AUTH_COOKIE, authCookieOptions } from "../lib/session.js";
import {
    currentPasswordField,
    emailField,
    hashPassword,
    nameField,
    newPasswordField,
    phoneField,
    publicUserSelect,
} from "../lib/userFields.js";
import { requireAuth } from "../middleware/requireAuth.js";

const updateProfileSchema = z.object({
    name: nameField,
    phone: phoneField,
    email: emailField,
    // Only required when the email changes (checked below).
    currentPassword: currentPasswordField.optional(),
});

const changePasswordSchema = z.object({
    currentPassword: currentPasswordField,
    newPassword: newPasswordField,
});

const deleteAccountSchema = z.object({
    password: currentPasswordField,
});

function sendInvalidInput(res: Response, error: z.ZodError) {
    res.status(400).json({ error: "Invalid input", details: z.flattenError(error) });
}

async function passwordMatches(userId: string, password: string): Promise<boolean> {
    const { passwordHash } = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true },
    });
    return bcrypt.compare(password, passwordHash);
}

export const accountRouter = Router();

accountRouter.use(requireAuth);

accountRouter.patch("/", async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        sendInvalidInput(res, parsed.error);
        return;
    }

    const userId = req.user!.id;
    const { name, phone, email, currentPassword } = parsed.data;

    // Changing the login email is sensitive: someone at an unlocked computer
    // shouldn't be able to take over the account, so ask for the password.
    const current = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true },
    });
    if (email !== current.email) {
        if (!currentPassword || !(await passwordMatches(userId, currentPassword))) {
            res.status(401).json({ error: "Current password is incorrect" });
            return;
        }
    }

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { name, phone: phone || null, email },
            select: publicUserSelect,
        });
        res.json({ user });
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

accountRouter.post("/password", async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        sendInvalidInput(res, parsed.error);
        return;
    }

    const userId = req.user!.id;
    const { currentPassword, newPassword } = parsed.data;
    if (!(await passwordMatches(userId, currentPassword))) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
    }

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPassword) },
    });
    res.status(204).end();
});

accountRouter.delete("/", async (req, res) => {
    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
        sendInvalidInput(res, parsed.error);
        return;
    }

    const userId = req.user!.id;
    if (!(await passwordMatches(userId, parsed.data.password))) {
        res.status(401).json({ error: "Password is incorrect" });
        return;
    }

    // Don't let a traveler vanish in the middle of a booked or ongoing trip.
    const activeTrips = await prisma.tripRequest.count({
        where: { travelerId: userId, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    });
    if (activeTrips > 0) {
        res.status(409).json({ error: "Account has an active trip" });
        return;
    }

    // Both deletes succeed together or not at all.
    await prisma.$transaction([
        prisma.tripRequest.deleteMany({ where: { travelerId: userId } }),
        prisma.user.delete({ where: { id: userId } }),
    ]);

    res.clearCookie(AUTH_COOKIE, authCookieOptions);
    res.status(204).end();
});
