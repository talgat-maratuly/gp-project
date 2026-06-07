-- Order lifecycle v2: spec-canonical statuses, septic sub-stage, audit log, cancel/recreate

-- CreateEnum
CREATE TYPE "SepticStage" AS ENUM ('ARRIVED', 'PUMPING', 'LOADED', 'DISPOSAL_ARRIVED', 'DISPOSAL_COMPLETED');
CREATE TYPE "OrderActorRole" AS ENUM ('client', 'spec', 'system', 'admin');

-- New Order columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "septicStage" "SepticStage";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "noShowAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "canceledByRole" "OrderActorRole";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "newWarningSentAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "acceptedReminderSentAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recreatedFromId" TEXT;

-- Derive septic sub-stage from legacy granular status before remap
UPDATE "Order" SET "septicStage" = 'ARRIVED'            WHERE "status"::text = 'ARRIVED';
UPDATE "Order" SET "septicStage" = 'PUMPING'            WHERE "status"::text = 'STARTED';
UPDATE "Order" SET "septicStage" = 'LOADED'             WHERE "status"::text = 'LOADED';
UPDATE "Order" SET "septicStage" = 'DISPOSAL_ARRIVED'   WHERE "status"::text = 'DISPOSAL_ARRIVED';
UPDATE "Order" SET "septicStage" = 'DISPOSAL_COMPLETED' WHERE "status"::text = 'DISPOSAL_COMPLETED';

-- Recreate OrderStatus enum with spec-canonical values
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'ACCEPTED', 'ON_WAY', 'IN_PROCESS', 'COMPLETED', 'EXPIRED', 'CANCELED_BY_CLIENT', 'CANCELED_BY_SPEC', 'NO_SHOW');

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING (
  CASE "status"::text
    WHEN 'NEW' THEN 'NEW'
    WHEN 'ACCEPTED' THEN 'ACCEPTED'
    WHEN 'ON_THE_WAY' THEN 'ON_WAY'
    WHEN 'ARRIVED' THEN 'ON_WAY'
    WHEN 'STARTED' THEN 'IN_PROCESS'
    WHEN 'LOADED' THEN 'IN_PROCESS'
    WHEN 'DISPOSAL_ARRIVED' THEN 'IN_PROCESS'
    WHEN 'DISPOSAL_COMPLETED' THEN 'IN_PROCESS'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CLIENT_CONFIRMED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'CANCELED_BY_SPEC'
    ELSE 'NEW'
  END::"OrderStatus"
);

ALTER TABLE "GeoUpdate" ALTER COLUMN "status" TYPE "OrderStatus" USING (
  CASE "status"::text
    WHEN 'NEW' THEN 'NEW'
    WHEN 'ACCEPTED' THEN 'ACCEPTED'
    WHEN 'ON_THE_WAY' THEN 'ON_WAY'
    WHEN 'ARRIVED' THEN 'ON_WAY'
    WHEN 'STARTED' THEN 'IN_PROCESS'
    WHEN 'LOADED' THEN 'IN_PROCESS'
    WHEN 'DISPOSAL_ARRIVED' THEN 'IN_PROCESS'
    WHEN 'DISPOSAL_COMPLETED' THEN 'IN_PROCESS'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CLIENT_CONFIRMED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'CANCELED_BY_SPEC'
    ELSE NULL
  END::"OrderStatus"
);

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "OrderStatus_old";

-- Mark migrated cancellations with timestamp
UPDATE "Order" SET "canceledAt" = "updatedAt", "canceledByRole" = 'spec'
  WHERE "status" = 'CANCELED_BY_SPEC' AND "canceledAt" IS NULL;

-- Self relation for re-create
ALTER TABLE "Order" ADD CONSTRAINT "Order_recreatedFromId_fkey"
  FOREIGN KEY ("recreatedFromId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Order_recreatedFromId_idx" ON "Order"("recreatedFromId");

-- Immutable audit log
CREATE TABLE "OrderEventLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "OrderActorRole" NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderEventLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderEventLog_orderId_idx" ON "OrderEventLog"("orderId");
CREATE INDEX "OrderEventLog_action_idx" ON "OrderEventLog"("action");
CREATE INDEX "OrderEventLog_createdAt_idx" ON "OrderEventLog"("createdAt");
ALTER TABLE "OrderEventLog" ADD CONSTRAINT "OrderEventLog_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
