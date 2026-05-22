-- CreateEnum
CREATE TYPE "FurnitureServiceType" AS ENUM ('furniture_manufacturing', 'furniture_assembly', 'furniture_repair');

-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN "serviceAccess" "FurnitureServiceType"[] DEFAULT ARRAY[]::"FurnitureServiceType"[];

-- CreateTable
CREATE TABLE "FurnitureExecutorOrder" (
    "id" TEXT NOT NULL,
    "serviceType" "FurnitureServiceType" NOT NULL,
    "serviceProjectId" TEXT,
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "comment" TEXT,
    "city" TEXT DEFAULT 'Уральск',
    "status" "QrOrderStatus" NOT NULL DEFAULT 'new',
    "assignedPartnerId" TEXT,
    "executorInternal" BOOLEAN NOT NULL DEFAULT true,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FurnitureExecutorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FurnitureExecutorOrder_serviceProjectId_key" ON "FurnitureExecutorOrder"("serviceProjectId");

-- CreateIndex
CREATE INDEX "FurnitureExecutorOrder_assignedPartnerId_idx" ON "FurnitureExecutorOrder"("assignedPartnerId");

-- CreateIndex
CREATE INDEX "FurnitureExecutorOrder_serviceType_idx" ON "FurnitureExecutorOrder"("serviceType");

-- CreateIndex
CREATE INDEX "FurnitureExecutorOrder_status_idx" ON "FurnitureExecutorOrder"("status");

-- AddForeignKey
ALTER TABLE "FurnitureExecutorOrder" ADD CONSTRAINT "FurnitureExecutorOrder_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
