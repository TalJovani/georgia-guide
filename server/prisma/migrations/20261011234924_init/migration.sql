-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'GUIDE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('NEW', 'ITINERARY_SENT', 'IN_REVISION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "KosherPreference" AS ENUM ('NONE', 'KOSHER_STYLE', 'KOSHER', 'MEHADRIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAVELER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripRequest" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "travelersCount" INTEGER NOT NULL,
    "budget" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "kosher" "KosherPreference" NOT NULL DEFAULT 'NONE',
    "needsFlights" BOOLEAN NOT NULL DEFAULT false,
    "needsHotels" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "travelerId" TEXT NOT NULL,
    "guideId" TEXT,

    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TripRequest_travelerId_idx" ON "TripRequest"("travelerId");

-- CreateIndex
CREATE INDEX "TripRequest_guideId_idx" ON "TripRequest"("guideId");

-- CreateIndex
CREATE INDEX "TripRequest_status_idx" ON "TripRequest"("status");

-- AddForeignKey
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
