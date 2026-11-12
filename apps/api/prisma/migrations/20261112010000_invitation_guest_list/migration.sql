CREATE TABLE "invitation_guests" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "token" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3),
    "lastCopiedAt" TIMESTAMP(3),
    "lastWhatsappOpenedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedInCount" INTEGER NOT NULL DEFAULT 0,
    "checkedInById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invitation_guests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invitation_guests_party_size" CHECK ("partySize" BETWEEN 1 AND 50),
    CONSTRAINT "invitation_guests_checkin_count" CHECK ("checkedInCount" BETWEEN 0 AND 50)
);
CREATE UNIQUE INDEX "invitation_guests_token_key" ON "invitation_guests"("token");
CREATE INDEX "invitation_guests_invitationId_deletedAt_createdAt_idx" ON "invitation_guests"("invitationId", "deletedAt", "createdAt");
ALTER TABLE "invitation_guests" ADD CONSTRAINT "invitation_guests_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
