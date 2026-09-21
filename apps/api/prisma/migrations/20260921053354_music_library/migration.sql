-- CreateEnum
CREATE TYPE "MusicLicense" AS ENUM ('PUBLIC_DOMAIN', 'CC0', 'ROYALTY_FREE', 'CC_BY', 'OTHER');

-- CreateEnum
CREATE TYPE "MusicStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "music_tracks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "licenseType" "MusicLicense" NOT NULL,
    "licenseNote" TEXT,
    "sourceUrl" TEXT,
    "attribution" TEXT,
    "minTier" "TemplateTier" NOT NULL DEFAULT 'STANDARD',
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSec" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "MusicStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "music_tracks_storageKey_key" ON "music_tracks"("storageKey");

-- CreateIndex
CREATE INDEX "music_tracks_status_minTier_sortOrder_idx" ON "music_tracks"("status", "minTier", "sortOrder");
