ALTER TYPE "AiArtifactDomain" ADD VALUE IF NOT EXISTS 'PLANT_DOCTOR';

CREATE TYPE "PlantCaseStatus" AS ENUM (
  'NEW',
  'AI_ANALYZED',
  'SPECIALIST_REVIEW',
  'SPECIALIST_CONFIRMED',
  'ADMIN_APPROVED',
  'CLOSED'
);

CREATE TABLE "PlantCase" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "orderId" TEXT,
  "assignedPartnerId" TEXT,
  "city" TEXT NOT NULL,
  "description" TEXT,
  "photoUrl" TEXT NOT NULL,
  "status" "PlantCaseStatus" NOT NULL DEFAULT 'NEW',
  "aiDiagnosis" JSONB NOT NULL,
  "aiRecommendations" JSONB NOT NULL,
  "aiIssues" JSONB NOT NULL,
  "aiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "needsSpecialistReview" BOOLEAN NOT NULL DEFAULT true,
  "specialistDiagnosis" TEXT,
  "specialistRecommendation" TEXT,
  "specialistReviewedAt" TIMESTAMP(3),
  "adminApprovedAt" TIMESTAMP(3),
  "addedToKnowledgeBaseAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlantCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlantKnowledgePhoto" (
  "id" TEXT NOT NULL,
  "plantCaseId" TEXT NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "pest" TEXT,
  "deficiency" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlantKnowledgePhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlantCase_orderId_key" ON "PlantCase"("orderId");
CREATE INDEX "PlantCase_clientId_idx" ON "PlantCase"("clientId");
CREATE INDEX "PlantCase_assignedPartnerId_idx" ON "PlantCase"("assignedPartnerId");
CREATE INDEX "PlantCase_city_idx" ON "PlantCase"("city");
CREATE INDEX "PlantCase_status_idx" ON "PlantCase"("status");
CREATE INDEX "PlantCase_createdAt_idx" ON "PlantCase"("createdAt");
CREATE INDEX "PlantKnowledgePhoto_city_idx" ON "PlantKnowledgePhoto"("city");
CREATE INDEX "PlantKnowledgePhoto_diagnosis_idx" ON "PlantKnowledgePhoto"("diagnosis");
CREATE INDEX "PlantKnowledgePhoto_createdAt_idx" ON "PlantKnowledgePhoto"("createdAt");

ALTER TABLE "PlantCase" ADD CONSTRAINT "PlantCase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantCase" ADD CONSTRAINT "PlantCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlantCase" ADD CONSTRAINT "PlantCase_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlantKnowledgePhoto" ADD CONSTRAINT "PlantKnowledgePhoto_plantCaseId_fkey" FOREIGN KEY ("plantCaseId") REFERENCES "PlantCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
