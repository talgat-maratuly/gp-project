-- Multi-application specialist onboarding
CREATE TYPE "SpecialistRejectionReasonCode" AS ENUM (
  'DOCUMENTS_UNCLEAR',
  'MISSING_PHOTOS',
  'INCORRECT_INFORMATION',
  'VEHICLE_NOT_SUITABLE',
  'OTHER'
);

ALTER TABLE "SpecialistRequest" DROP CONSTRAINT IF EXISTS "SpecialistRequest_userId_key";
ALTER TABLE "SpecialistRequest" DROP CONSTRAINT IF EXISTS "SpecialistRequest_partnerProfileId_key";

ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "subserviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "idCardFrontUrl" TEXT;
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "idCardBackUrl" TEXT;
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "vehicleData" JSONB;
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "equipmentPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "workExperience" TEXT;
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "personalDataAcceptedAt" TIMESTAMP(3);
ALTER TABLE "SpecialistRequest" ADD COLUMN IF NOT EXISTS "rejectionReasonCode" "SpecialistRejectionReasonCode";

-- primaryCategory NOT NULL: backfill from existing
UPDATE "SpecialistRequest"
SET "primaryCategory" = COALESCE("primaryCategory", 'SEPTIC'::"OrderCategory")
WHERE "primaryCategory" IS NULL;

ALTER TABLE "SpecialistRequest" ALTER COLUMN "primaryCategory" SET NOT NULL;

ALTER TABLE "PartnerServiceOffering" ADD COLUMN IF NOT EXISTS "specialistRequestId" TEXT;

ALTER TABLE "PartnerServiceOffering" ADD CONSTRAINT "PartnerServiceOffering_specialistRequestId_fkey"
  FOREIGN KEY ("specialistRequestId") REFERENCES "SpecialistRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "SpecialistRequest_userId_idx" ON "SpecialistRequest"("userId");
CREATE INDEX IF NOT EXISTS "SpecialistRequest_userId_status_idx" ON "SpecialistRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "SpecialistRequest_userId_primaryCategory_idx" ON "SpecialistRequest"("userId", "primaryCategory");
CREATE INDEX IF NOT EXISTS "PartnerServiceOffering_specialistRequestId_idx" ON "PartnerServiceOffering"("specialistRequestId");

UPDATE "PartnerServiceOffering" o
SET "specialistRequestId" = sr.id
FROM "SpecialistRequest" sr
WHERE sr."partnerProfileId" = o."partnerId" AND o."specialistRequestId" IS NULL;
