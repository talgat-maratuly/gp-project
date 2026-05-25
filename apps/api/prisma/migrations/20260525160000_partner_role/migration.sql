-- CreateEnum
CREATE TYPE "PartnerRole" AS ENUM ('SPECIALIST', 'SHOP', 'MIXED_PARTNER');

-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN "partnerRole" "PartnerRole";

-- Backfill from partnerType
UPDATE "PartnerProfile" SET "partnerRole" = 'SHOP' WHERE "partnerType" = 'SHOP';
UPDATE "PartnerProfile" SET "partnerRole" = 'SPECIALIST' WHERE "partnerRole" IS NULL;

-- CreateIndex
CREATE INDEX "PartnerProfile_partnerRole_idx" ON "PartnerProfile"("partnerRole");
