-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'LEGAL_ENTITY');

-- AlterTable ClientProfile
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "bin" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "legalAddress" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;

-- AlterTable PartnerProfile
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "bin" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "legalAddress" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "idDocumentNumber" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "documents" JSONB;
