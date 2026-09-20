/*
  Warnings:

  - Added the required column `contentType` to the `media_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `media_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `media_files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderKind" AS ENUM ('NEW', 'EXTENSION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MediaStatus" ADD VALUE 'PENDING';
ALTER TYPE "MediaStatus" ADD VALUE 'UPLOADED';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "features" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "layout" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "contentType" TEXT NOT NULL,
ADD COLUMN     "included" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "replacesId" TEXT,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "activeWeeks" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "extendsInvitationId" TEXT,
ADD COLUMN     "kind" "OrderKind" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentToken" TEXT,
ADD COLUMN     "paymentUrl" TEXT;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "includedWeeks" INTEGER NOT NULL DEFAULT 4;

-- CreateIndex
CREATE INDEX "invitations_status_expiresAt_idx" ON "invitations"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "media_files_invitationId_idx" ON "media_files"("invitationId");

-- CreateIndex
CREATE INDEX "media_files_status_expiresAt_idx" ON "media_files"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "rsvp_guests_invitationId_createdAt_idx" ON "rsvp_guests"("invitationId", "createdAt");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_extendsInvitationId_fkey" FOREIGN KEY ("extendsInvitationId") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
