-- Partner moderation system

CREATE TYPE "PartnerType" AS ENUM (
  'SEPTIC_SERVICE',
  'LAWN_MOWING',
  'IRRIGATION_SERVICE',
  'CLEANING_SERVICE',
  'SHOP',
  'SPECIALIST',
  'DELIVERY',
  'OTHER'
);

CREATE TYPE "PartnerStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'SUSPENDED'
);

CREATE TYPE "PartnerModerationAction" AS ENUM (
  'APPROVE',
  'REJECT',
  'REVISION',
  'SUSPEND',
  'RESTORE',
  'RESUBMIT'
);

ALTER TABLE "Store" ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "StoreStatus" RENAME TO "StoreStatus_old";

CREATE TYPE "StoreStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'ACTIVE',
  'INACTIVE',
  'BLOCKED'
);

ALTER TABLE "Store"
ALTER COLUMN "status" TYPE "StoreStatus"
USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'PENDING_REVIEW'::"StoreStatus"
    WHEN 'ACTIVE' THEN 'APPROVED'::"StoreStatus"
    ELSE "status"::text::"StoreStatus"
  END
);

ALTER TABLE "Store" ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW';

DROP TYPE "StoreStatus_old";

ALTER TABLE "PartnerProfile" ADD COLUMN "regionId" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "partnerType" "PartnerType";
ALTER TABLE "PartnerProfile" ADD COLUMN "status" "PartnerStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "PartnerProfile" ADD COLUMN "companyName" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "fullName" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "address" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "description" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "vehiclePhotos" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PartnerProfile" ADD COLUMN "equipmentPhotos" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PartnerProfile" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "revisionComment" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "approvedByAdminId" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "PartnerProfile" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "PartnerProfile" ADD COLUMN "suspendedAt" TIMESTAMP(3);

UPDATE "PartnerProfile" p SET "regionId" = u."regionId" FROM "User" u WHERE p."userId" = u."id" AND p."regionId" IS NULL AND u."regionId" IS NOT NULL;
UPDATE "PartnerProfile" SET "status" = 'APPROVED' WHERE "status" = 'DRAFT';
UPDATE "PartnerProfile" SET "companyName" = COALESCE("companyName", "company");
UPDATE "PartnerProfile" SET "fullName" = COALESCE("fullName", (SELECT "name" FROM "User" WHERE "User"."id" = "PartnerProfile"."userId"));

CREATE INDEX "PartnerProfile_regionId_idx" ON "PartnerProfile"("regionId");
CREATE INDEX "PartnerProfile_status_idx" ON "PartnerProfile"("status");
CREATE INDEX "PartnerProfile_partnerType_idx" ON "PartnerProfile"("partnerType");

ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PartnerModerationAuditLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" "PartnerModerationAction" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerModerationAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerModerationAuditLog_partnerId_idx" ON "PartnerModerationAuditLog"("partnerId");
CREATE INDEX "PartnerModerationAuditLog_adminUserId_idx" ON "PartnerModerationAuditLog"("adminUserId");
CREATE INDEX "PartnerModerationAuditLog_createdAt_idx" ON "PartnerModerationAuditLog"("createdAt");

ALTER TABLE "PartnerModerationAuditLog" ADD CONSTRAINT "PartnerModerationAuditLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerModerationAuditLog" ADD CONSTRAINT "PartnerModerationAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

