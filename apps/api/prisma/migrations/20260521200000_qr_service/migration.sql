-- CreateEnum
CREATE TYPE "QrObjectType" AS ENUM ('filter', 'irrigation', 'furniture', 'septic', 'lawn', 'flowerbed', 'equipment', 'other');
CREATE TYPE "QrServiceType" AS ENUM ('filter_replacement', 'irrigation_service', 'furniture_repair', 'furniture_assembly', 'septic_pumping', 'lawn_care', 'flowerbed_care', 'equipment_repair', 'other_service');
CREATE TYPE "QrObjectStatus" AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE "QrOrderStatus" AS ENUM ('new', 'assigned', 'accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "QRCodeObject" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "QrObjectType" NOT NULL,
    "serviceType" "QrServiceType" NOT NULL,
    "objectId" TEXT,
    "productId" TEXT,
    "clientId" TEXT,
    "partnerId" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "photo" TEXT,
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "status" "QrObjectStatus" NOT NULL DEFAULT 'active',
    "phone" TEXT,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCodeObject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QRServiceOrder" (
    "id" TEXT NOT NULL,
    "qrCodeObjectId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "serviceType" "QrServiceType" NOT NULL,
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "comment" TEXT,
    "photo" TEXT,
    "status" "QrOrderStatus" NOT NULL DEFAULT 'new',
    "assignedPartnerId" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QRScanLog" (
    "id" TEXT NOT NULL,
    "qrCodeObjectId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "action" TEXT NOT NULL DEFAULT 'view',

    CONSTRAINT "QRScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QRCodeObject_qrCode_key" ON "QRCodeObject"("qrCode");
CREATE INDEX "QRCodeObject_franchiseId_idx" ON "QRCodeObject"("franchiseId");
CREATE INDEX "QRCodeObject_partnerId_idx" ON "QRCodeObject"("partnerId");
CREATE INDEX "QRServiceOrder_qrCode_idx" ON "QRServiceOrder"("qrCode");
CREATE INDEX "QRServiceOrder_assignedPartnerId_idx" ON "QRServiceOrder"("assignedPartnerId");
CREATE INDEX "QRServiceOrder_status_idx" ON "QRServiceOrder"("status");
CREATE INDEX "QRScanLog_qrCodeObjectId_idx" ON "QRScanLog"("qrCodeObjectId");
CREATE INDEX "QRScanLog_scannedAt_idx" ON "QRScanLog"("scannedAt");

-- AddForeignKey
ALTER TABLE "QRCodeObject" ADD CONSTRAINT "QRCodeObject_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QRCodeObject" ADD CONSTRAINT "QRCodeObject_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QRServiceOrder" ADD CONSTRAINT "QRServiceOrder_qrCodeObjectId_fkey" FOREIGN KEY ("qrCodeObjectId") REFERENCES "QRCodeObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QRServiceOrder" ADD CONSTRAINT "QRServiceOrder_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QRScanLog" ADD CONSTRAINT "QRScanLog_qrCodeObjectId_fkey" FOREIGN KEY ("qrCodeObjectId") REFERENCES "QRCodeObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
