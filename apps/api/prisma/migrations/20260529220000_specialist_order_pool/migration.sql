-- Specialist order pool: city/region matching + BUSY work status

-- AlterEnum
ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'BUSY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "regionId" TEXT;

-- Backfill region/city from creating client where possible
UPDATE "Order" o
SET "city" = cp."city"
FROM "ClientProfile" cp
WHERE o."clientId" = cp."id" AND o."city" IS NULL;

-- Indexes for pool feed matching
CREATE INDEX IF NOT EXISTS "Order_status_assignedPartnerId_idx" ON "Order"("status", "assignedPartnerId");
CREATE INDEX IF NOT EXISTS "Order_regionId_idx" ON "Order"("regionId");
