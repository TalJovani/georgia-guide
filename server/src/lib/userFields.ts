import bcrypt from "bcryptjs";
import { z } from "zod";

// Shared rules for user data, so register, login and account editing agree.

export const BCRYPT_ROUNDS = 12;

export const emailField = z.string().trim().toLowerCase().pipe(z.email());
export const nameField = z.string().trim().min(1).max(100);
export const phoneField = z.string().trim().max(30);
// bcrypt only looks at the first 72 bytes of a password.
export const newPasswordField = z.string().min(8).max(72);
export const currentPasswordField = z.string().min(1).max(72);

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Columns that are safe to send to the browser (never passwordHash).
export const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
} as const;
