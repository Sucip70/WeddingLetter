-- CreateTable
CREATE TABLE "demo_photos" (
    "slot" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_photos_pkey" PRIMARY KEY ("slot")
);
