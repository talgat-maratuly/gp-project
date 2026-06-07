-- SpecialistRequest moderation entity
CREATE TABLE "SpecialistRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerProfileId" TEXT NOT NULL,
  "regionId" TEXT NOT NULL,
  "city" TEXT,
  "district" TEXT,
  "primarySubserviceId" TEXT,
  "primaryCategory" "OrderCategory",
  "status" "RequestStatus" NOT NULL,
  "moderatorId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "resubmittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SpecialistRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpecialistRequest_userId_key" ON "SpecialistRequest"("userId");
CREATE UNIQUE INDEX "SpecialistRequest_partnerProfileId_key" ON "SpecialistRequest"("partnerProfileId");
CREATE INDEX "SpecialistRequest_regionId_idx" ON "SpecialistRequest"("regionId");
CREATE INDEX "SpecialistRequest_status_idx" ON "SpecialistRequest"("status");
CREATE INDEX "SpecialistRequest_createdAt_idx" ON "SpecialistRequest"("createdAt");
CREATE INDEX "SpecialistRequest_city_idx" ON "SpecialistRequest"("city");

ALTER TABLE "SpecialistRequest" ADD CONSTRAINT "SpecialistRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialistRequest" ADD CONSTRAINT "SpecialistRequest_partnerProfileId_fkey"
  FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialistRequest" ADD CONSTRAINT "SpecialistRequest_regionId_fkey"
  FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecialistRequest" ADD CONSTRAINT "SpecialistRequest_moderatorId_fkey"
  FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill from partner profiles (service specialists only)
INSERT INTO "SpecialistRequest" (
  "id", "userId", "partnerProfileId", "regionId", "city", "status",
  "moderatorId", "approvedAt", "rejectionReason", "rejectedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  p."userId",
  p.id,
  COALESCE(p."regionId", u."regionId"),
  p.city,
  COALESCE(
    p."requestStatus",
    CASE
      WHEN p.status IN ('PENDING_REVIEW', 'NEEDS_REVISION') THEN 'PENDING'::"RequestStatus"
      WHEN p.status = 'APPROVED' THEN 'APPROVED'::"RequestStatus"
      WHEN p.status = 'REJECTED' THEN 'REJECTED'::"RequestStatus"
      ELSE 'PENDING'::"RequestStatus"
    END
  ),
  p."approvedByAdminId",
  p."approvedAt",
  p."rejectionReason",
  p."rejectedAt",
  p."createdAt",
  p."updatedAt"
FROM "PartnerProfile" p
JOIN "User" u ON u.id = p."userId"
WHERE COALESCE(p."regionId", u."regionId") IS NOT NULL
  AND (p."partnerRole" IN ('SPECIALIST', 'MIXED_PARTNER') OR p."partnerRole" IS NULL AND p."partnerType" IS DISTINCT FROM 'SHOP')
ON CONFLICT DO NOTHING;
