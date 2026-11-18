-- Nullable: existing orders are not retroactively opted in or expired.
ALTER TABLE "orders"
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "termsVersion" TEXT,
  ADD COLUMN "termsSnapshot" JSONB,
  ADD COLUMN "draftRetentionDays" INTEGER,
  ADD COLUMN "draftExpiresAt" TIMESTAMP(3),
  ADD COLUMN "draftReminder14At" TIMESTAMP(3),
  ADD COLUMN "draftReminder3At" TIMESTAMP(3);
CREATE INDEX "orders_draftExpiresAt_idx" ON "orders"("draftExpiresAt");
ALTER TABLE "orders" ADD CONSTRAINT "orders_draftRetentionDays_check"
  CHECK ("draftRetentionDays" IS NULL OR "draftRetentionDays" BETWEEN 1 AND 3650);
