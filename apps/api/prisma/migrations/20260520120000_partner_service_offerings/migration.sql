-- PartnerDirection / OrderCategory: электросети
ALTER TYPE "PartnerDirection" ADD VALUE IF NOT EXISTS 'ELECTRICAL';
ALTER TYPE "OrderCategory" ADD VALUE IF NOT EXISTS 'ELECTRICAL';

-- CreateEnum
CREATE TYPE "PartnerOfferingStatus" AS ENUM ('PENDING_MODERATION', 'ACTIVE', 'TEMPORARILY_BLOCKED', 'REJECTED');

-- CreateTable
CREATE TABLE "PartnerServiceOffering" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "subserviceId" TEXT NOT NULL,
    "status" "PartnerOfferingStatus" NOT NULL DEFAULT 'PENDING_MODERATION',
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerServiceOffering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerServiceOffering_partnerId_idx" ON "PartnerServiceOffering"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerServiceOffering_status_idx" ON "PartnerServiceOffering"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerServiceOffering_partnerId_subserviceId_key" ON "PartnerServiceOffering"("partnerId", "subserviceId");

-- AddForeignKey
ALTER TABLE "PartnerServiceOffering" ADD CONSTRAINT "PartnerServiceOffering_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
