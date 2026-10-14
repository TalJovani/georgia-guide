-- AlterTable
ALTER TABLE "TripRequest" ADD COLUMN     "aiSuggestion" TEXT,
ADD COLUMN     "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
