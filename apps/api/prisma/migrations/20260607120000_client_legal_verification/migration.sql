ALTER TABLE "ClientProfile"
  ADD COLUMN "legalForm" TEXT,
  ADD COLUMN "legalVerificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN "legalReviewComment" TEXT,
  ADD COLUMN "legalVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "legalRejectedAt" TIMESTAMP(3),
  ADD COLUMN "egovCheckStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "egovProvider" TEXT,
  ADD COLUMN "egovCheckedAt" TIMESTAMP(3),
  ADD COLUMN "ecpStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "ecpOwnerType" TEXT,
  ADD COLUMN "ecpSubject" TEXT,
  ADD COLUMN "ecpBoundAt" TIMESTAMP(3);

UPDATE "ClientProfile"
SET "legalVerificationStatus" = 'PENDING',
    "egovCheckStatus" = 'PENDING'
WHERE "accountType" = 'LEGAL_ENTITY';
