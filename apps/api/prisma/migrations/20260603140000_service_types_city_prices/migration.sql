-- Global service types + city pricing
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubserviceType" (
    "id" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubserviceType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CityServicePrice" (
    "id" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "subserviceTypeId" TEXT,
    "oblastId" TEXT,
    "cityId" TEXT NOT NULL,
    "franchiseId" TEXT,
    "price" INTEGER NOT NULL,
    "gpCommission" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "volumeStart" INTEGER,
    "volumeEnd" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CityServicePrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceType_code_key" ON "ServiceType"("code");
CREATE UNIQUE INDEX "SubserviceType_serviceTypeId_code_key" ON "SubserviceType"("serviceTypeId", "code");
CREATE INDEX "SubserviceType_serviceTypeId_idx" ON "SubserviceType"("serviceTypeId");
CREATE INDEX "CityServicePrice_cityId_idx" ON "CityServicePrice"("cityId");
CREATE INDEX "CityServicePrice_serviceTypeId_cityId_idx" ON "CityServicePrice"("serviceTypeId", "cityId");
CREATE INDEX "CityServicePrice_franchiseId_idx" ON "CityServicePrice"("franchiseId");

ALTER TABLE "SubserviceType" ADD CONSTRAINT "SubserviceType_serviceTypeId_fkey"
    FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CityServicePrice" ADD CONSTRAINT "CityServicePrice_serviceTypeId_fkey"
    FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CityServicePrice" ADD CONSTRAINT "CityServicePrice_subserviceTypeId_fkey"
    FOREIGN KEY ("subserviceTypeId") REFERENCES "SubserviceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
