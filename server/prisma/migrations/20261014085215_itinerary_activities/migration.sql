/*
  Warnings:

  - You are about to drop the column `details` on the `ItineraryDay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ItineraryDay" DROP COLUMN "details";

-- CreateTable
CREATE TABLE "ItineraryActivity" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "dayId" TEXT NOT NULL,

    CONSTRAINT "ItineraryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryActivity_dayId_idx" ON "ItineraryActivity"("dayId");

-- AddForeignKey
ALTER TABLE "ItineraryActivity" ADD CONSTRAINT "ItineraryActivity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
