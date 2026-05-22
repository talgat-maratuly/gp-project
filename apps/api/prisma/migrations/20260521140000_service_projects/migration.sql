-- CreateEnum
CREATE TYPE "ServiceProjectType" AS ENUM ('hunter_irrigation', 'furniture');
CREATE TYPE "ServiceProjectStatus" AS ENUM ('draft', 'submitted', 'review', 'assigned', 'in_progress', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkedServiceType" TEXT;

-- CreateTable
CREATE TABLE "ServiceProject" (
    "id" TEXT NOT NULL,
    "type" "ServiceProjectType" NOT NULL,
    "status" "ServiceProjectStatus" NOT NULL DEFAULT 'draft',
    "clientId" TEXT NOT NULL,
    "partnerId" TEXT,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "gpCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "franchiseId" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HunterIrrigationProject" (
    "id" TEXT NOT NULL,
    "serviceProjectId" TEXT NOT NULL,
    "photo" TEXT,
    "length" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "waterSource" TEXT NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "waterFlow" DOUBLE PRECISION NOT NULL,
    "zones" INTEGER NOT NULL,
    "sprinklers" JSONB NOT NULL,
    "pipes" JSONB NOT NULL,
    "valves" JSONB NOT NULL,
    "controller" JSONB NOT NULL,
    "estimate" JSONB NOT NULL,
    "drawing2D" JSONB NOT NULL,
    CONSTRAINT "HunterIrrigationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FurnitureProject" (
    "id" TEXT NOT NULL,
    "serviceProjectId" TEXT NOT NULL,
    "photo" TEXT,
    "roomWidth" DOUBLE PRECISION NOT NULL,
    "roomHeight" DOUBLE PRECISION NOT NULL,
    "furnitureLength" DOUBLE PRECISION NOT NULL,
    "furnitureDepth" DOUBLE PRECISION NOT NULL,
    "material" TEXT NOT NULL,
    "facadeMaterial" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "modules" INTEGER NOT NULL,
    "parts" JSONB NOT NULL,
    "hardware" JSONB NOT NULL,
    "estimate" JSONB NOT NULL,
    "drawing2D" JSONB NOT NULL,
    CONSTRAINT "FurnitureProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HunterIrrigationProject_serviceProjectId_key" ON "HunterIrrigationProject"("serviceProjectId");
CREATE UNIQUE INDEX "FurnitureProject_serviceProjectId_key" ON "FurnitureProject"("serviceProjectId");
CREATE INDEX "ServiceProject_clientId_idx" ON "ServiceProject"("clientId");
CREATE INDEX "ServiceProject_partnerId_idx" ON "ServiceProject"("partnerId");
CREATE INDEX "ServiceProject_type_status_idx" ON "ServiceProject"("type", "status");

ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HunterIrrigationProject" ADD CONSTRAINT "HunterIrrigationProject_serviceProjectId_fkey" FOREIGN KEY ("serviceProjectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FurnitureProject" ADD CONSTRAINT "FurnitureProject_serviceProjectId_fkey" FOREIGN KEY ("serviceProjectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
