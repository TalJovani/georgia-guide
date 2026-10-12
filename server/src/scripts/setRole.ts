// Admin script: change a user's role from the command line.
// Usage: npm run set-role -- <email> <TRAVELER|GUIDE>
import "dotenv/config";
import { z } from "zod";
import { prisma } from "../db.js";
import { UserRole } from "../generated/prisma/enums.js";

const argsSchema = z.tuple([
    z.string().trim().toLowerCase().pipe(z.email()),
    z.enum(UserRole),
]);

async function main() {
    const parsed = argsSchema.safeParse(process.argv.slice(2));
    if (!parsed.success) {
        console.error("Usage: npm run set-role -- <email> <TRAVELER|GUIDE>");
        process.exitCode = 1;
        return;
    }

    const [email, role] = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`No user with email ${email}. They need to register first.`);
        process.exitCode = 1;
        return;
    }

    if (user.role === role) {
        console.log(`${user.name} <${email}> is already ${role}. Nothing to do.`);
        return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { role } });
    console.log(`${user.name} <${email}>: ${user.role} -> ${role}`);
    console.log("They need to log out and log in again for the change to apply.");
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
