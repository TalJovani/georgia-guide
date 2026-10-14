import type { Prisma } from "../generated/prisma/client.js";

// How to load an itinerary: days in order, each with its activities by start time.
export const itineraryDaysInclude = {
    orderBy: { dayNumber: "asc" },
    include: { activities: { orderBy: { startTime: "asc" } } },
} satisfies Prisma.ItineraryDayFindManyArgs;
