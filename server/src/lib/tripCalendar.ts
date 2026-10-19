import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";

// Trips happen in Georgia, so a trip's "today" is the date in Tbilisi, not in Israel.
const TRIP_TIME_ZONE = "Asia/Tbilisi";

// Today's date in Georgia as midnight UTC, the same form Prisma uses for @db.Date columns.
export function todayInGeorgia(): Date {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: TRIP_TIME_ZONE }).format(new Date());
    return new Date(date);
}

// Nobody presses a button when a trip starts or ends, so the dates move the status:
// CONFIRMED -> IN_PROGRESS on the first day, IN_PROGRESS -> COMPLETED after the last day.
// Both moves are in the status state machine. Call this before reading trips.
export async function advanceTripsByDate(where: Prisma.TripRequestWhereInput): Promise<void> {
    const today = todayInGeorgia();
    await prisma.tripRequest.updateMany({
        where: { ...where, status: "CONFIRMED", startDate: { lte: today } },
        data: { status: "IN_PROGRESS" },
    });
    // Runs second, so a trip confirmed after its last day goes straight through to COMPLETED.
    await prisma.tripRequest.updateMany({
        where: { ...where, status: "IN_PROGRESS", endDate: { lt: today } },
        data: { status: "COMPLETED" },
    });
}
