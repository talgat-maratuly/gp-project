-- Unify order assignment field: partnerId → assignedPartnerId
ALTER TABLE "Order" RENAME COLUMN "partnerId" TO "assignedPartnerId";

DROP INDEX IF EXISTS "Order_partnerId_idx";
CREATE INDEX "Order_assignedPartnerId_idx" ON "Order"("assignedPartnerId");
