CREATE TYPE "AiArtifactDomain" AS ENUM (
  'ORDERS',
  'MARKET',
  'PARTNERS',
  'ADMIN',
  'IRRIGATION',
  'REPORT_SERVICE',
  'REPORT_PARTNER',
  'REPORT_ADMIN'
);

CREATE TYPE "AiSeverity" AS ENUM ('ok', 'info', 'warning', 'error');

CREATE TABLE "AiCheck" (
  "id" TEXT NOT NULL,
  "domain" "AiArtifactDomain" NOT NULL,
  "severity" "AiSeverity" NOT NULL DEFAULT 'info',
  "code" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "recommendation" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "payload" JSONB,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiRecommendation" (
  "id" TEXT NOT NULL,
  "domain" "AiArtifactDomain" NOT NULL,
  "severity" "AiSeverity" NOT NULL DEFAULT 'info',
  "code" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "recommendation" TEXT,
  "requiresSpecialistReview" BOOLEAN NOT NULL DEFAULT false,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "entityType" TEXT,
  "entityId" TEXT,
  "payload" JSONB,
  "result" JSONB NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiReport" (
  "id" TEXT NOT NULL,
  "domain" "AiArtifactDomain" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "fromDate" TIMESTAMP(3),
  "toDate" TIMESTAMP(3),
  "payload" JSONB,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiCheck_domain_idx" ON "AiCheck"("domain");
CREATE INDEX "AiCheck_entityType_entityId_idx" ON "AiCheck"("entityType", "entityId");
CREATE INDEX "AiCheck_severity_idx" ON "AiCheck"("severity");
CREATE INDEX "AiCheck_createdAt_idx" ON "AiCheck"("createdAt");

CREATE INDEX "AiRecommendation_domain_idx" ON "AiRecommendation"("domain");
CREATE INDEX "AiRecommendation_entityType_entityId_idx" ON "AiRecommendation"("entityType", "entityId");
CREATE INDEX "AiRecommendation_severity_idx" ON "AiRecommendation"("severity");
CREATE INDEX "AiRecommendation_createdAt_idx" ON "AiRecommendation"("createdAt");

CREATE INDEX "AiReport_domain_idx" ON "AiReport"("domain");
CREATE INDEX "AiReport_createdAt_idx" ON "AiReport"("createdAt");
