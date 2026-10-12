import type { TripStatus } from "../generated/prisma/enums.js";

// The trip status state machine: for each status, the statuses it may move to.
// Any move that is not listed here is rejected.
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
    // Guide builds an itinerary and sends it to the traveler.
    NEW: ["ITINERARY_SENT", "CANCELLED"],
    // Traveler either asks for changes or approves.
    ITINERARY_SENT: ["IN_REVISION", "CONFIRMED", "CANCELLED"],
    // Guide sends an updated itinerary.
    IN_REVISION: ["ITINERARY_SENT", "CANCELLED"],
    // The trip starts.
    CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
    // The trip ends.
    IN_PROGRESS: ["COMPLETED"],
    // Final statuses, nothing comes after them.
    COMPLETED: [],
    CANCELLED: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
    return TRIP_STATUS_TRANSITIONS[from].includes(to);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days between the cancellation and the trip start, for the refund policy.
// Negative if the cancellation happened after the start date.
export function daysBeforeStart(cancelledAt: Date, startDate: Date): number {
    return Math.floor((startDate.getTime() - cancelledAt.getTime()) / MS_PER_DAY);
}
