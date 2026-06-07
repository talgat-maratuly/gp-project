ALTER TYPE "WorkStatus" ADD VALUE IF NOT EXISTS 'ON_ROUTE';

CREATE TABLE "partner_status" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "status" "WorkStatus" NOT NULL,
  "orderId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partner_location" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "orderId" TEXT,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "accuracyM" DOUBLE PRECISION,
  "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partner_vehicle" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "category" "OrderCategory" NOT NULL DEFAULT 'SEPTIC',
  "vehicleType" TEXT NOT NULL DEFAULT 'septic_truck',
  "volumeM3" INTEGER,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" "WorkStatus" NOT NULL DEFAULT 'OFFLINE',
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partner_availability" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "city" TEXT,
  "serviceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "WorkStatus" NOT NULL DEFAULT 'OFFLINE',
  "activeOrderId" TEXT,
  "etaFreeAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_availability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_availability_partnerId_key" ON "partner_availability"("partnerId");
CREATE INDEX "partner_status_partnerId_createdAt_idx" ON "partner_status"("partnerId", "createdAt");
CREATE INDEX "partner_status_status_idx" ON "partner_status"("status");
CREATE INDEX "partner_location_partnerId_createdAt_idx" ON "partner_location"("partnerId", "createdAt");
CREATE INDEX "partner_location_orderId_createdAt_idx" ON "partner_location"("orderId", "createdAt");
CREATE INDEX "partner_vehicle_partnerId_idx" ON "partner_vehicle"("partnerId");
CREATE INDEX "partner_vehicle_category_volumeM3_idx" ON "partner_vehicle"("category", "volumeM3");
CREATE INDEX "partner_vehicle_status_idx" ON "partner_vehicle"("status");
CREATE INDEX "partner_availability_city_idx" ON "partner_availability"("city");
CREATE INDEX "partner_availability_status_idx" ON "partner_availability"("status");

ALTER TABLE "partner_status" ADD CONSTRAINT "partner_status_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_location" ADD CONSTRAINT "partner_location_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_vehicle" ADD CONSTRAINT "partner_vehicle_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_availability" ADD CONSTRAINT "partner_availability_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
