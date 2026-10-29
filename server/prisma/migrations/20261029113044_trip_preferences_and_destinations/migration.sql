-- Hand-edited after `prisma migrate dev --create-only`: the trips and guides already in the
-- database are all from the Georgia-only days, so they are given Georgia here.

-- CreateEnum
CREATE TYPE "BudgetLevel" AS ENUM ('BUDGET', 'MID', 'LUXURY');

-- CreateEnum
CREATE TYPE "Mobility" AS ENUM ('NO_LIMITS', 'LIMITED_WALKING', 'WHEELCHAIR');

-- CreateEnum
CREATE TYPE "DietaryNeed" AS ENUM ('VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'LACTOSE_FREE');

-- CreateEnum
CREATE TYPE "Transport" AS ENUM ('RENTAL_CAR', 'PRIVATE_DRIVER', 'PUBLIC_TRANSPORT', 'WALK_AND_TAXI');

-- CreateEnum
CREATE TYPE "Lodging" AS ENUM ('SINGLE_BASE', 'MOVING');

-- CreateEnum
CREATE TYPE "Pace" AS ENUM ('RELAXED', 'BALANCED', 'PACKED');

-- CreateEnum
CREATE TYPE "DailyRhythm" AS ENUM ('EARLY_BIRD', 'FLEXIBLE', 'LATE_RISER');

-- CreateEnum
CREATE TYPE "TravelStyle" AS ENUM ('CLASSIC', 'MIXED', 'LIKE_A_LOCAL');

-- CreateEnum
CREATE TYPE "TripPurpose" AS ENUM ('COUPLE', 'HONEYMOON', 'FAMILY', 'FRIENDS', 'SOLO', 'CELEBRATION');

-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('NATURE', 'HISTORY', 'FOOD', 'WINE', 'ART', 'SHOPPING', 'NIGHTLIFE', 'ADVENTURE', 'BEACHES', 'CULTURE');

-- AlterTable
-- A required column needs a value on the rows already there: add it with a temporary default,
-- which fills every existing trip with Georgia, then drop the default so new trips must say.
ALTER TABLE "TripRequest" ADD COLUMN     "budgetLevel" "BudgetLevel",
ADD COLUMN     "destinationCountry" TEXT NOT NULL DEFAULT 'GE';
ALTER TABLE "TripRequest" ALTER COLUMN "destinationCountry" DROP DEFAULT;

-- CreateTable
CREATE TABLE "GuideDestination" (
    "countryCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guideId" TEXT NOT NULL,

    CONSTRAINT "GuideDestination_pkey" PRIMARY KEY ("guideId","countryCode")
);

-- CreateTable
CREATE TABLE "DestinationCostEstimate" (
    "countryCode" TEXT NOT NULL,
    "budgetPerDay" INTEGER NOT NULL,
    "midPerDay" INTEGER NOT NULL,
    "luxuryPerDay" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationCostEstimate_pkey" PRIMARY KEY ("countryCode")
);

-- CreateTable
CREATE TABLE "TripPreferences" (
    "id" TEXT NOT NULL,
    "cities" TEXT[],
    "arrivalTime" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "adults" INTEGER NOT NULL,
    "childrenAges" INTEGER[],
    "seniors" INTEGER NOT NULL,
    "mobility" "Mobility" NOT NULL,
    "dietaryNeeds" "DietaryNeed"[],
    "allergies" TEXT,
    "transport" "Transport" NOT NULL,
    "lodging" "Lodging" NOT NULL,
    "lodgingBooked" TEXT,
    "lovedInterests" "Interest"[],
    "likedInterests" "Interest"[],
    "pace" "Pace" NOT NULL,
    "dailyRhythm" "DailyRhythm" NOT NULL,
    "style" "TravelStyle" NOT NULL,
    "purpose" "TripPurpose" NOT NULL,
    "firstVisit" BOOLEAN NOT NULL,
    "mustSee" TEXT,
    "avoid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tripRequestId" TEXT NOT NULL,

    CONSTRAINT "TripPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideDestination_countryCode_idx" ON "GuideDestination"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "TripPreferences_tripRequestId_key" ON "TripPreferences"("tripRequestId");

-- CreateIndex
CREATE INDEX "TripRequest_destinationCountry_idx" ON "TripRequest"("destinationCountry");

-- AddForeignKey
ALTER TABLE "GuideDestination" ADD CONSTRAINT "GuideDestination_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreferences" ADD CONSTRAINT "TripPreferences_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: the guides already signed up cover Georgia.
INSERT INTO "GuideDestination" ("countryCode", "guideId")
SELECT 'GE', "id" FROM "User" WHERE "role" = 'GUIDE';
