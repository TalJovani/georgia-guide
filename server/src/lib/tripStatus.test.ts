import { describe, expect, it } from "vitest";
import type { TripStatus } from "../generated/prisma/enums.js";
import {
    canTransition,
    daysBeforeStart,
    ITINERARY_EDITABLE_STATUSES,
    statusesThatCanMoveTo,
    TRIP_STATUS_TRANSITIONS,
} from "./tripStatus.js";

const ALL_STATUSES = Object.keys(TRIP_STATUS_TRANSITIONS) as TripStatus[];
const FINAL_STATUSES: TripStatus[] = ["COMPLETED", "CANCELLED"];

describe("trip status state machine", () => {
    it("follows the happy path from a new request to a completed trip", () => {
        const path: TripStatus[] = ["NEW", "ITINERARY_SENT", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
        for (let i = 0; i < path.length - 1; i++) {
            expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
        }
    });

    it("allows any number of revision rounds before approval", () => {
        expect(canTransition("ITINERARY_SENT", "IN_REVISION")).toBe(true);
        expect(canTransition("IN_REVISION", "ITINERARY_SENT")).toBe(true);
    });

    it.each([
        ["NEW", "CONFIRMED"], // the traveler can't approve an itinerary that was never sent
        ["NEW", "IN_PROGRESS"],
        ["IN_REVISION", "CONFIRMED"], // ...or one the guide is still changing
        ["IN_PROGRESS", "CANCELLED"], // a trip that has started can't be cancelled
        ["CONFIRMED", "ITINERARY_SENT"], // no going back after approval
        ["COMPLETED", "NEW"],
    ] as const)("refuses %s -> %s", (from, to) => {
        expect(canTransition(from, to)).toBe(false);
    });

    it("never moves a status to itself", () => {
        for (const status of ALL_STATUSES) {
            expect(canTransition(status, status)).toBe(false);
        }
    });

    it("has nothing after the final statuses", () => {
        for (const status of FINAL_STATUSES) {
            expect(TRIP_STATUS_TRANSITIONS[status]).toEqual([]);
        }
    });

    // A graph check: from every status there is some path to a final one, so no trip can get
    // stuck. Breadth-first search over the transition table.
    it("lets every trip reach a final status", () => {
        for (const start of ALL_STATUSES) {
            const seen = new Set<TripStatus>([start]);
            const queue: TripStatus[] = [start];
            while (queue.length > 0) {
                const current = queue.shift()!;
                for (const next of TRIP_STATUS_TRANSITIONS[current]) {
                    if (!seen.has(next)) {
                        seen.add(next);
                        queue.push(next);
                    }
                }
            }
            expect(FINAL_STATUSES.some((final) => seen.has(final)), `stuck from ${start}`).toBe(true);
        }
    });

    it("lists the statuses that may move to a given one", () => {
        expect(statusesThatCanMoveTo("ITINERARY_SENT").sort()).toEqual(["IN_REVISION", "NEW"]);
        expect(statusesThatCanMoveTo("CANCELLED").sort()).toEqual([
            "CONFIRMED",
            "IN_REVISION",
            "ITINERARY_SENT",
            "NEW",
        ]);
        expect(statusesThatCanMoveTo("NEW")).toEqual([]);
    });

    it("lets the guide edit the itinerary only while the traveler is not reviewing it", () => {
        expect(ITINERARY_EDITABLE_STATUSES).toContain("NEW");
        expect(ITINERARY_EDITABLE_STATUSES).toContain("IN_REVISION");
        expect(ITINERARY_EDITABLE_STATUSES).not.toContain("ITINERARY_SENT");
        expect(ITINERARY_EDITABLE_STATUSES).not.toContain("CONFIRMED");
    });
});

describe("daysBeforeStart (refund policy)", () => {
    const start = new Date("2027-05-10T00:00:00Z");

    it("counts whole days before the trip starts", () => {
        expect(daysBeforeStart(new Date("2027-05-03T00:00:00Z"), start)).toBe(7);
        expect(daysBeforeStart(new Date("2027-05-09T00:00:00Z"), start)).toBe(1);
    });

    it("rounds a part of a day down, never in the traveler's favour", () => {
        expect(daysBeforeStart(new Date("2027-05-09T01:00:00Z"), start)).toBe(0);
        expect(daysBeforeStart(new Date("2027-05-02T12:00:00Z"), start)).toBe(7);
    });

    it("is zero on the start itself and negative after it", () => {
        expect(daysBeforeStart(start, start)).toBe(0);
        expect(daysBeforeStart(new Date("2027-05-11T00:00:00Z"), start)).toBe(-1);
    });
});
