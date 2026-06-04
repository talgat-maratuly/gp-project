-- Franchise city fields + service catalog per franchise/city
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Franchise" ADD COLUMN IF NOT EXISTS "cityId" TEXT;

CREATE TABLE "FranchiseService" (
    "id" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "cityId" TEXT,
    "names" JSONB NOT NULL,
    "basePrice" INTEGER NOT NULL DEFAULT 0,
    "gpCommission" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FranchiseSubservice" (
    "id" TEXT NOT NULL,
    "franchiseServiceId" TEXT NOT NULL,
    "externalId" TEXT,
    "names" JSONB NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "gpCommission" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseSubservice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FranchiseService_franchiseId_templateId_key" ON "FranchiseService"("franchiseId", "templateId");
CREATE INDEX "FranchiseService_franchiseId_idx" ON "FranchiseService"("franchiseId");
CREATE INDEX "FranchiseSubservice_franchiseServiceId_idx" ON "FranchiseSubservice"("franchiseServiceId");

ALTER TABLE "FranchiseService" ADD CONSTRAINT "FranchiseService_franchiseId_fkey"
    FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FranchiseSubservice" ADD CONSTRAINT "FranchiseSubservice_franchiseServiceId_fkey"
    FOREIGN KEY ("franchiseServiceId") REFERENCES "FranchiseService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
