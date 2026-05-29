-- User Status Management: Request / Account / Work (тәуелсіз)
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE "WorkStatus" AS ENUM ('ONLINE', 'OFFLINE');

ALTER TABLE "User" ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "accountStatusReason" TEXT;
ALTER TABLE "User" ADD COLUMN "accountStatusChangedAt" TIMESTAMP(3);

ALTER TABLE "PartnerProfile" ADD COLUMN "requestStatus" "RequestStatus";
ALTER TABLE "PartnerProfile" ADD COLUMN "workStatus" "WorkStatus" NOT NULL DEFAULT 'OFFLINE';

-- workStatus ← isOnline
UPDATE "PartnerProfile" SET "workStatus" = 'ONLINE' WHERE "isOnline" = true;
UPDATE "PartnerProfile" SET "workStatus" = 'OFFLINE' WHERE "isOnline" = false OR "isOnline" IS NULL;

-- requestStatus ← PartnerStatus (workflow)
UPDATE "PartnerProfile"
SET "requestStatus" = 'PENDING'
WHERE status IN ('PENDING_REVIEW', 'NEEDS_REVISION');

UPDATE "PartnerProfile"
SET "requestStatus" = 'APPROVED'
WHERE status = 'APPROVED';

UPDATE "PartnerProfile"
SET "requestStatus" = 'REJECTED'
WHERE status = 'REJECTED';

-- SUSPENDED specialist: moderation бекітілген, request APPROVED қалуы мүмкін
UPDATE "PartnerProfile"
SET "requestStatus" = 'APPROVED'
WHERE status = 'SUSPENDED' AND "requestStatus" IS NULL;
