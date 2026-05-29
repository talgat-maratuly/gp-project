CREATE TYPE "AccountStatusChangeType" AS ENUM ('AUTO', 'OPERATOR', 'SYSTEM');

CREATE TABLE "AccountStatusLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "oldStatus" "AccountStatus" NOT NULL,
  "newStatus" "AccountStatus" NOT NULL,
  "changeType" "AccountStatusChangeType" NOT NULL,
  "reason" TEXT NOT NULL,
  "rule" TEXT,
  "changedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserComplaint" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "regionId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserComplaint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");
CREATE INDEX "AccountStatusLog_userId_idx" ON "AccountStatusLog"("userId");
CREATE INDEX "AccountStatusLog_newStatus_idx" ON "AccountStatusLog"("newStatus");
CREATE INDEX "AccountStatusLog_changeType_idx" ON "AccountStatusLog"("changeType");
CREATE INDEX "AccountStatusLog_rule_idx" ON "AccountStatusLog"("rule");
CREATE INDEX "AccountStatusLog_createdAt_idx" ON "AccountStatusLog"("createdAt");
CREATE INDEX "UserComplaint_targetUserId_createdAt_idx" ON "UserComplaint"("targetUserId", "createdAt");
CREATE INDEX "UserComplaint_regionId_idx" ON "UserComplaint"("regionId");

ALTER TABLE "AccountStatusLog" ADD CONSTRAINT "AccountStatusLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountStatusLog" ADD CONSTRAINT "AccountStatusLog_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserComplaint" ADD CONSTRAINT "UserComplaint_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserComplaint" ADD CONSTRAINT "UserComplaint_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
