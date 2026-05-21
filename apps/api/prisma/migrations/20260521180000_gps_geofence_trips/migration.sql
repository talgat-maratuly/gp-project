-- GPS tracking, geofences, trips, disposal events, extended order statuses

-- CreateEnum
CREATE TYPE "GeofenceZoneType" AS ENUM ('SEPTIC_DISPOSAL', 'STATION', 'POLYGON', 'UNLOAD_POINT');
CREATE TYPE "MovementState" AS ENUM ('IDLE', 'MOVING', 'STOPPED');
CREATE TYPE "DisposalEventType" AS ENUM ('LEGAL', 'ILLEGAL', 'SUSPECTED');

-- AlterEnum OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'LOADED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPOSAL_ARRIVED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPOSAL_COMPLETED';

-- Order fields
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "illegalDisposal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "etaMinutes" INTEGER;

-- GeofenceZone
CREATE TABLE "GeofenceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GeofenceZoneType" NOT NULL DEFAULT 'SEPTIC_DISPOSAL',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusM" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "polygon" JSONB,
    "city" TEXT NOT NULL DEFAULT 'Уральск',
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeofenceZone_pkey" PRIMARY KEY ("id")
);

-- Trip
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "clientEnteredAt" TIMESTAMP(3),
    "clientDwellStartedAt" TIMESTAMP(3),
    "clientLeftAt" TIMESTAMP(3),
    "disposalEnteredAt" TIMESTAMP(3),
    "disposalDwellStartedAt" TIMESTAMP(3),
    "disposalLeftAt" TIMESTAMP(3),
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastSpeedKmh" DOUBLE PRECISION,
    "lastHeading" DOUBLE PRECISION,
    "lastMovement" "MovementState" NOT NULL DEFAULT 'IDLE',
    "lastPointAt" TIMESTAMP(3),
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Trip_orderId_key" ON "Trip"("orderId");
CREATE INDEX "Trip_partnerId_idx" ON "Trip"("partnerId");

ALTER TABLE "Trip" ADD CONSTRAINT "Trip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GpsPoint
CREATE TABLE "GpsPoint" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "orderId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "movement" "MovementState",
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GpsPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GpsPoint_orderId_recordedAt_idx" ON "GpsPoint"("orderId", "recordedAt");
CREATE INDEX "GpsPoint_partnerId_recordedAt_idx" ON "GpsPoint"("partnerId", "recordedAt");

ALTER TABLE "GpsPoint" ADD CONSTRAINT "GpsPoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GpsPoint" ADD CONSTRAINT "GpsPoint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GpsPoint" ADD CONSTRAINT "GpsPoint_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DisposalEvent
CREATE TABLE "DisposalEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "zoneId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "type" "DisposalEventType" NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisposalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DisposalEvent_orderId_idx" ON "DisposalEvent"("orderId");
CREATE INDEX "DisposalEvent_createdAt_idx" ON "DisposalEvent"("createdAt");

ALTER TABLE "DisposalEvent" ADD CONSTRAINT "DisposalEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisposalEvent" ADD CONSTRAINT "DisposalEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisposalEvent" ADD CONSTRAINT "DisposalEvent_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "GeofenceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
