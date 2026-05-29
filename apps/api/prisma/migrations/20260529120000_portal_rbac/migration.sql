-- Portal RBAC: көп рөл, франшиза
CREATE TYPE "PortalRole" AS ENUM (
  'CLIENT',
  'SPECIALIST',
  'GP_OPERATOR',
  'FRANCHISE_OWNER',
  'GLOBAL_OPERATOR',
  'ADMIN'
);

CREATE TABLE "Franchise" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "regionId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "portalRoles" "PortalRole"[] DEFAULT ARRAY['CLIENT']::"PortalRole"[];
ALTER TABLE "User" ADD COLUMN "franchiseId" TEXT;

CREATE INDEX "Franchise_regionId_idx" ON "Franchise"("regionId");
CREATE INDEX "User_franchiseId_idx" ON "User"("franchiseId");

ALTER TABLE "Franchise" ADD CONSTRAINT "Franchise_regionId_fkey"
  FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_franchiseId_fkey"
  FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Legacy Role → portalRoles backfill
UPDATE "User" SET "portalRoles" = ARRAY['CLIENT']::"PortalRole"[]
WHERE "portalRoles" IS NULL OR cardinality("portalRoles") = 0;

UPDATE "User" u
SET "portalRoles" = (
  SELECT ARRAY(
    SELECT DISTINCT r FROM unnest(
      u."portalRoles" || ARRAY['SPECIALIST']::"PortalRole"[]
    ) AS r
  )
)
FROM "PartnerProfile" p
WHERE p."userId" = u.id
  AND p.status = 'APPROVED'
  AND NOT ('SPECIALIST' = ANY (u."portalRoles"));

UPDATE "User"
SET "portalRoles" = (
  SELECT ARRAY(
    SELECT DISTINCT r FROM unnest(
      "portalRoles" || ARRAY['GP_OPERATOR']::"PortalRole"[]
    ) AS r
  )
)
WHERE role = 'REGION_ADMIN' AND NOT ('GP_OPERATOR' = ANY ("portalRoles"));

UPDATE "User"
SET "portalRoles" = (
  SELECT ARRAY(
    SELECT DISTINCT r FROM unnest(
      "portalRoles" || ARRAY['GLOBAL_OPERATOR']::"PortalRole"[]
    ) AS r
  )
)
WHERE role IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT ('GLOBAL_OPERATOR' = ANY ("portalRoles"));

UPDATE "User"
SET "portalRoles" = (
  SELECT ARRAY(
    SELECT DISTINCT r FROM unnest(
      "portalRoles" || ARRAY['ADMIN']::"PortalRole"[]
    ) AS r
  )
)
WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND NOT ('ADMIN' = ANY ("portalRoles"));

UPDATE "User"
SET "portalRoles" = (
  SELECT ARRAY(
    SELECT DISTINCT r FROM unnest(
      "portalRoles" || ARRAY['SPECIALIST']::"PortalRole"[]
    ) AS r
  )
)
WHERE role = 'PARTNER' AND NOT ('SPECIALIST' = ANY ("portalRoles"));
