-- CreateEnum
CREATE TYPE "NurseryProductStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PREORDER_ONLY');

-- CreateEnum
CREATE TYPE "NurseryRequestStatus" AS ENUM ('CREATED', 'OFFERED', 'ACCEPTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NurseryOfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "GrowingPreorderStatus" AS ENUM ('CREATED', 'OFFERED', 'ACCEPTED', 'CONTRACT_PENDING', 'IN_GROWING', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryPartnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeliveryOrderStatus" AS ENUM ('CREATED', 'OFFERED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryOfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterEnum
ALTER TYPE "PartnerDirection" ADD VALUE 'DELIVERY';

-- AlterEnum
ALTER TYPE "PartnerType" ADD VALUE 'NURSERY';

-- DropForeignKey
ALTER TABLE "GpsPoint" DROP CONSTRAINT "GpsPoint_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_partnerId_fkey";

-- AlterTable
ALTER TABLE "Franchise" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "nurseries" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalForm" TEXT,
    "bin" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "delivers" BOOLEAN NOT NULL DEFAULT false,
    "growsToOrder" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurseries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursery_products" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "plantType" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "heightCm" INTEGER,
    "sizeLabel" TEXT,
    "ageMonths" INTEGER,
    "price" DECIMAL(12,2),
    "availability" "NurseryProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "delivery" BOOLEAN NOT NULL DEFAULT false,
    "growToOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nursery_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursery_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "plantType" TEXT,
    "plantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "heightCm" INTEGER,
    "ageMonths" INTEGER,
    "desiredDeliveryAt" TIMESTAMP(3),
    "deliveryNeeded" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "examplePhotoUrl" TEXT,
    "status" "NurseryRequestStatus" NOT NULL DEFAULT 'CREATED',
    "acceptedOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nursery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursery_offers" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(12,2) NOT NULL,
    "availableQty" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "supplyDate" TIMESTAMP(3),
    "deliveryTerms" TEXT,
    "comment" TEXT,
    "status" "NurseryOfferStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nursery_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growing_preorders" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "sizeRequirement" TEXT,
    "varietyRequirement" TEXT,
    "deliveryNeeded" BOOLEAN NOT NULL DEFAULT false,
    "contractNeeded" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "status" "GrowingPreorderStatus" NOT NULL DEFAULT 'CREATED',
    "acceptedOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growing_preorders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growing_contracts" (
    "id" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2),
    "readyDate" TIMESTAMP(3),
    "minBatch" INTEGER,
    "paymentTerms" TEXT,
    "similarPhotoUrl" TEXT,
    "comment" TEXT,
    "status" "NurseryOfferStatus" NOT NULL DEFAULT 'SENT',
    "contractStatus" "GrowingPreorderStatus" NOT NULL DEFAULT 'OFFERED',
    "growingSchedule" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growing_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_partners" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "direction" TEXT,
    "transportType" TEXT NOT NULL,
    "bodyVolumeM3" DOUBLE PRECISION,
    "capacityKg" INTEGER,
    "freePlaces" INTEGER NOT NULL DEFAULT 0,
    "basePrice" DECIMAL(12,2),
    "availableDates" JSONB NOT NULL DEFAULT '[]',
    "gpsStatus" "WorkStatus" NOT NULL DEFAULT 'OFFLINE',
    "status" "DeliveryPartnerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "deliveryPartnerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "transportType" TEXT,
    "price" DECIMAL(12,2),
    "availableDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "requesterPartnerId" TEXT,
    "cityId" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "cargoType" TEXT NOT NULL,
    "cargoDescription" TEXT,
    "weightKg" INTEGER,
    "volumeM3" DOUBLE PRECISION,
    "desiredDate" TIMESTAMP(3),
    "linkedNurseryRequestId" TEXT,
    "status" "DeliveryOrderStatus" NOT NULL DEFAULT 'CREATED',
    "acceptedOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_offers" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "deliveryPartnerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "pickupDate" TIMESTAMP(3),
    "etaDate" TIMESTAMP(3),
    "comment" TEXT,
    "status" "DeliveryOfferStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nurseries_partnerId_idx" ON "nurseries"("partnerId");

-- CreateIndex
CREATE INDEX "nurseries_cityId_idx" ON "nurseries"("cityId");

-- CreateIndex
CREATE INDEX "nurseries_status_idx" ON "nurseries"("status");

-- CreateIndex
CREATE INDEX "nurseries_createdAt_idx" ON "nurseries"("createdAt");

-- CreateIndex
CREATE INDEX "nursery_products_nurseryId_idx" ON "nursery_products"("nurseryId");

-- CreateIndex
CREATE INDEX "nursery_products_partnerId_idx" ON "nursery_products"("partnerId");

-- CreateIndex
CREATE INDEX "nursery_products_cityId_idx" ON "nursery_products"("cityId");

-- CreateIndex
CREATE INDEX "nursery_products_category_idx" ON "nursery_products"("category");

-- CreateIndex
CREATE INDEX "nursery_products_availability_idx" ON "nursery_products"("availability");

-- CreateIndex
CREATE UNIQUE INDEX "nursery_requests_acceptedOfferId_key" ON "nursery_requests"("acceptedOfferId");

-- CreateIndex
CREATE INDEX "nursery_requests_clientId_idx" ON "nursery_requests"("clientId");

-- CreateIndex
CREATE INDEX "nursery_requests_cityId_idx" ON "nursery_requests"("cityId");

-- CreateIndex
CREATE INDEX "nursery_requests_status_idx" ON "nursery_requests"("status");

-- CreateIndex
CREATE INDEX "nursery_requests_createdAt_idx" ON "nursery_requests"("createdAt");

-- CreateIndex
CREATE INDEX "nursery_offers_requestId_idx" ON "nursery_offers"("requestId");

-- CreateIndex
CREATE INDEX "nursery_offers_nurseryId_idx" ON "nursery_offers"("nurseryId");

-- CreateIndex
CREATE INDEX "nursery_offers_partnerId_idx" ON "nursery_offers"("partnerId");

-- CreateIndex
CREATE INDEX "nursery_offers_cityId_idx" ON "nursery_offers"("cityId");

-- CreateIndex
CREATE INDEX "nursery_offers_status_idx" ON "nursery_offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "nursery_offers_requestId_nurseryId_key" ON "nursery_offers"("requestId", "nurseryId");

-- CreateIndex
CREATE UNIQUE INDEX "growing_preorders_acceptedOfferId_key" ON "growing_preorders"("acceptedOfferId");

-- CreateIndex
CREATE INDEX "growing_preorders_clientId_idx" ON "growing_preorders"("clientId");

-- CreateIndex
CREATE INDEX "growing_preorders_cityId_idx" ON "growing_preorders"("cityId");

-- CreateIndex
CREATE INDEX "growing_preorders_status_idx" ON "growing_preorders"("status");

-- CreateIndex
CREATE INDEX "growing_preorders_createdAt_idx" ON "growing_preorders"("createdAt");

-- CreateIndex
CREATE INDEX "growing_contracts_preorderId_idx" ON "growing_contracts"("preorderId");

-- CreateIndex
CREATE INDEX "growing_contracts_partnerId_idx" ON "growing_contracts"("partnerId");

-- CreateIndex
CREATE INDEX "growing_contracts_cityId_idx" ON "growing_contracts"("cityId");

-- CreateIndex
CREATE INDEX "growing_contracts_status_idx" ON "growing_contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "growing_contracts_preorderId_partnerId_key" ON "growing_contracts"("preorderId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_partners_partnerId_key" ON "delivery_partners"("partnerId");

-- CreateIndex
CREATE INDEX "delivery_partners_cityId_idx" ON "delivery_partners"("cityId");

-- CreateIndex
CREATE INDEX "delivery_partners_status_idx" ON "delivery_partners"("status");

-- CreateIndex
CREATE INDEX "delivery_partners_gpsStatus_idx" ON "delivery_partners"("gpsStatus");

-- CreateIndex
CREATE INDEX "delivery_routes_deliveryPartnerId_idx" ON "delivery_routes"("deliveryPartnerId");

-- CreateIndex
CREATE INDEX "delivery_routes_partnerId_idx" ON "delivery_routes"("partnerId");

-- CreateIndex
CREATE INDEX "delivery_routes_cityId_idx" ON "delivery_routes"("cityId");

-- CreateIndex
CREATE INDEX "delivery_routes_fromCity_toCity_idx" ON "delivery_routes"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "delivery_routes_isActive_idx" ON "delivery_routes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_acceptedOfferId_key" ON "delivery_orders"("acceptedOfferId");

-- CreateIndex
CREATE INDEX "delivery_orders_clientId_idx" ON "delivery_orders"("clientId");

-- CreateIndex
CREATE INDEX "delivery_orders_requesterPartnerId_idx" ON "delivery_orders"("requesterPartnerId");

-- CreateIndex
CREATE INDEX "delivery_orders_cityId_idx" ON "delivery_orders"("cityId");

-- CreateIndex
CREATE INDEX "delivery_orders_fromCity_toCity_idx" ON "delivery_orders"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders"("status");

-- CreateIndex
CREATE INDEX "delivery_orders_createdAt_idx" ON "delivery_orders"("createdAt");

-- CreateIndex
CREATE INDEX "delivery_offers_deliveryOrderId_idx" ON "delivery_offers"("deliveryOrderId");

-- CreateIndex
CREATE INDEX "delivery_offers_deliveryPartnerId_idx" ON "delivery_offers"("deliveryPartnerId");

-- CreateIndex
CREATE INDEX "delivery_offers_partnerId_idx" ON "delivery_offers"("partnerId");

-- CreateIndex
CREATE INDEX "delivery_offers_cityId_idx" ON "delivery_offers"("cityId");

-- CreateIndex
CREATE INDEX "delivery_offers_status_idx" ON "delivery_offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_offers_deliveryOrderId_deliveryPartnerId_key" ON "delivery_offers"("deliveryOrderId", "deliveryPartnerId");

-- CreateIndex
CREATE INDEX "SpecialistRequest_partnerProfileId_idx" ON "SpecialistRequest"("partnerProfileId");

-- RenameForeignKey
ALTER TABLE "Order" RENAME CONSTRAINT "Order_partnerId_fkey" TO "Order_assignedPartnerId_fkey";

-- AddForeignKey
ALTER TABLE "nurseries" ADD CONSTRAINT "nurseries_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_products" ADD CONSTRAINT "nursery_products_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "nurseries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_requests" ADD CONSTRAINT "nursery_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_requests" ADD CONSTRAINT "nursery_requests_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "nursery_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_offers" ADD CONSTRAINT "nursery_offers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "nursery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_offers" ADD CONSTRAINT "nursery_offers_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "nurseries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursery_offers" ADD CONSTRAINT "nursery_offers_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growing_preorders" ADD CONSTRAINT "growing_preorders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growing_preorders" ADD CONSTRAINT "growing_preorders_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "growing_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growing_contracts" ADD CONSTRAINT "growing_contracts_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "growing_preorders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growing_contracts" ADD CONSTRAINT "growing_contracts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_partners" ADD CONSTRAINT "delivery_partners_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "delivery_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_linkedNurseryRequestId_fkey" FOREIGN KEY ("linkedNurseryRequestId") REFERENCES "nursery_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "delivery_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_offers" ADD CONSTRAINT "delivery_offers_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_offers" ADD CONSTRAINT "delivery_offers_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "delivery_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_offers" ADD CONSTRAINT "delivery_offers_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsPoint" ADD CONSTRAINT "GpsPoint_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
