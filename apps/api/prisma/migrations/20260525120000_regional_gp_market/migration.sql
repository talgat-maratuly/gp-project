-- Regional GP Market: regions, stores, market products, stock, market orders

-- AlterEnum Role
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'REGION_ADMIN';

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING');
CREATE TYPE "MarketOrderStatus" AS ENUM ('NEW', 'ACCEPTED', 'PAID', 'PACKING', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED', 'PROBLEM');
CREATE TYPE "MarketDeliveryType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateTable Region
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- User.regionId
ALTER TABLE "User" ADD COLUMN "regionId" TEXT;
CREATE INDEX "User_regionId_idx" ON "User"("regionId");
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Store
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "isOfflineStore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");
CREATE INDEX "Store_regionId_idx" ON "Store"("regionId");
CREATE INDEX "Store_status_idx" ON "Store"("status");

ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MarketProduct
CREATE TABLE "MarketProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "categoryId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketProduct_storeId_idx" ON "MarketProduct"("storeId");
CREATE INDEX "MarketProduct_regionId_idx" ON "MarketProduct"("regionId");
CREATE INDEX "MarketProduct_isActive_idx" ON "MarketProduct"("isActive");
CREATE INDEX "MarketProduct_categoryId_idx" ON "MarketProduct"("categoryId");

ALTER TABLE "MarketProduct" ADD CONSTRAINT "MarketProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketProduct" ADD CONSTRAINT "MarketProduct_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Stock_productId_key" ON "Stock"("productId");
CREATE INDEX "Stock_storeId_idx" ON "Stock"("storeId");
CREATE INDEX "Stock_regionId_idx" ON "Stock"("regionId");

ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MarketOrder
CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "MarketOrderStatus" NOT NULL DEFAULT 'NEW',
    "deliveryType" "MarketDeliveryType" NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketOrder_customerId_idx" ON "MarketOrder"("customerId");
CREATE INDEX "MarketOrder_regionId_idx" ON "MarketOrder"("regionId");
CREATE INDEX "MarketOrder_storeId_idx" ON "MarketOrder"("storeId");
CREATE INDEX "MarketOrder_status_idx" ON "MarketOrder"("status");
CREATE INDEX "MarketOrder_createdAt_idx" ON "MarketOrder"("createdAt");

ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MarketOrderItem
CREATE TABLE "MarketOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "MarketOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketOrderItem_orderId_idx" ON "MarketOrderItem"("orderId");
CREATE INDEX "MarketOrderItem_productId_idx" ON "MarketOrderItem"("productId");

ALTER TABLE "MarketOrderItem" ADD CONSTRAINT "MarketOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketOrderItem" ADD CONSTRAINT "MarketOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
