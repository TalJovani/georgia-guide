-- AlterEnum
ALTER TYPE "TripStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "TripRequest" ADD COLUMN     "cancelledAt" TIMESTAMP(3);
