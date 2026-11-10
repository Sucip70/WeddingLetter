-- Payment attempts are separate from the business order so customers can safely
-- abandon one pending channel and choose another without losing their invitation.
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATING', 'PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED');

CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerRef" TEXT,
    "token" TEXT,
    "redirectUrl" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATING',
    "cancelledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_attempts_providerOrderId_key" ON "payment_attempts"("providerOrderId");
CREATE UNIQUE INDEX "payment_attempts_orderId_sequence_key" ON "payment_attempts"("orderId", "sequence");
CREATE INDEX "payment_attempts_orderId_createdAt_idx" ON "payment_attempts"("orderId", "createdAt");
CREATE INDEX "payment_attempts_status_createdAt_idx" ON "payment_attempts"("status", "createdAt");

-- At most one attempt may be created or await payment for an order. This closes
-- the double-click/concurrent-request window that could otherwise create two payable codes.
CREATE UNIQUE INDEX "payment_attempts_one_active_per_order"
ON "payment_attempts"("orderId")
WHERE "status" IN ('CREATING', 'PENDING');

ALTER TABLE "payment_attempts"
ADD CONSTRAINT "payment_attempts_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve payment sessions created before this migration. Those sessions used
-- the internal order ID as Midtrans order_id.
INSERT INTO "payment_attempts" (
    "id", "orderId", "sequence", "provider", "providerOrderId", "providerRef",
    "token", "redirectUrl", "status", "cancelledAt", "paidAt", "createdAt", "updatedAt"
)
SELECT
    'legacy-' || "id",
    "id",
    1,
    COALESCE("paymentProvider", 'MIDTRANS'),
    "id",
    "paymentRef",
    "paymentToken",
    "paymentUrl",
    CASE
      WHEN "status" = 'PAID' THEN 'PAID'::"PaymentAttemptStatus"
      WHEN "status" = 'PENDING' THEN 'PENDING'::"PaymentAttemptStatus"
      WHEN "status" = 'EXPIRED' THEN 'EXPIRED'::"PaymentAttemptStatus"
      ELSE 'CANCELLED'::"PaymentAttemptStatus"
    END,
    CASE WHEN "status" = 'CANCELLED' THEN "updatedAt" ELSE NULL END,
    "paidAt",
    "createdAt",
    "updatedAt"
FROM "orders"
WHERE "paymentUrl" IS NOT NULL OR "paymentToken" IS NOT NULL OR "paymentProvider" IS NOT NULL;
