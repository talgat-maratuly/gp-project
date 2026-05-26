-- CreateEnum
CREATE TYPE "PasswordResetChannel" AS ENUM ('EMAIL', 'PHONE');

-- CreateTable
CREATE TABLE "PasswordResetChallenge" (
    "id" TEXT NOT NULL,
    "channel" "PasswordResetChannel" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "otpHash" TEXT,
    "resetTokenHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetChallenge_resetTokenHash_key" ON "PasswordResetChallenge"("resetTokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetChallenge_email_createdAt_idx" ON "PasswordResetChallenge"("email", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetChallenge_phone_createdAt_idx" ON "PasswordResetChallenge"("phone", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordResetChallenge" ADD CONSTRAINT "PasswordResetChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
