-- Keep existing budgets: the single budget becomes the bottom of the range.
ALTER TABLE "TripRequest" RENAME COLUMN "budget" TO "budgetMin";

-- AlterTable
ALTER TABLE "TripRequest" ADD COLUMN "budgetMax" INTEGER,
ADD COLUMN "needsCarRental" BOOLEAN NOT NULL DEFAULT false;
