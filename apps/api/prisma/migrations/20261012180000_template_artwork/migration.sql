-- Immutable, versioned artwork packages. Active manifests are additionally copied into
-- templates.layoutSchema.artwork so invitations retain the exact resolved version in snapshots.
CREATE TYPE "ArtworkStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "template_artwork_versions" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ArtworkStatus" NOT NULL DEFAULT 'DRAFT',
    "manifest" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "template_artwork_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "template_artwork_assets" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'default',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_artwork_assets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "templates" ADD COLUMN "artworkVersionId" TEXT;
CREATE UNIQUE INDEX "template_artwork_versions_designId_version_key" ON "template_artwork_versions"("designId", "version");
CREATE UNIQUE INDEX "template_artwork_assets_storageKey_key" ON "template_artwork_assets"("storageKey");
CREATE UNIQUE INDEX "template_artwork_assets_versionId_slot_variant_key" ON "template_artwork_assets"("versionId", "slot", "variant");
ALTER TABLE "templates" ADD CONSTRAINT "templates_artworkVersionId_fkey" FOREIGN KEY ("artworkVersionId") REFERENCES "template_artwork_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "template_artwork_assets" ADD CONSTRAINT "template_artwork_assets_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "template_artwork_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Register the four Git-backed compatibility packages without overwriting artwork an administrator
-- may already have added to layoutSchema. Future publications use R2/local object keys.
INSERT INTO "template_artwork_versions" ("id", "designId", "version", "status", "manifest", "publishedAt", "updatedAt") VALUES
('seasonal-sakura-anime-v1', 'sakura-anime', 1, 'PUBLISHED', '{"schemaVersion":1,"designId":"sakura-anime","artworkVersion":1,"assets":{"coverBackground":{"default":{"url":"/themes/seasonal/sakura-pastel-bg.webp","contentType":"image/webp","width":1024,"height":1536,"sizeBytes":112914}},"coverForeground":{"default":{"url":"/themes/seasonal/sakura-pastel-fg.webp","contentType":"image/webp","width":960,"height":592,"sizeBytes":248762}}},"presentation":{"backgroundFit":"cover","backgroundPosition":"center-top","foregroundPosition":"bottom-center","foregroundMotion":"breathe","opacity":1,"scale":1,"backgroundLayer":0,"decorationLayer":1,"foregroundLayer":3,"showOnOrnamentCover":true,"showOnPhotoCover":false},"fallback":{}}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seasonal-semi-v1', 'semi', 1, 'PUBLISHED', '{"schemaVersion":1,"designId":"semi","artworkVersion":1,"assets":{"coverBackground":{"default":{"url":"/themes/seasonal/spring-bg.webp","contentType":"image/webp","width":1024,"height":1536,"sizeBytes":158158}},"coverForeground":{"default":{"url":"/themes/seasonal/spring-fg.webp","contentType":"image/webp","width":960,"height":683,"sizeBytes":340584}}},"presentation":{"backgroundFit":"cover","backgroundPosition":"center-top","foregroundPosition":"bottom-center","foregroundMotion":"breathe","opacity":1,"scale":1,"backgroundLayer":0,"decorationLayer":1,"foregroundLayer":3,"showOnOrnamentCover":true,"showOnPhotoCover":false},"fallback":{}}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seasonal-gugur-v1', 'gugur', 1, 'PUBLISHED', '{"schemaVersion":1,"designId":"gugur","artworkVersion":1,"assets":{"coverBackground":{"default":{"url":"/themes/seasonal/autumn-bg.webp","contentType":"image/webp","width":1024,"height":1536,"sizeBytes":282146}},"coverForeground":{"default":{"url":"/themes/seasonal/autumn-fg.webp","contentType":"image/webp","width":960,"height":465,"sizeBytes":182744}}},"presentation":{"backgroundFit":"cover","backgroundPosition":"center-top","foregroundPosition":"bottom-center","foregroundMotion":"breathe","opacity":1,"scale":1,"backgroundLayer":0,"decorationLayer":1,"foregroundLayer":3,"showOnOrnamentCover":true,"showOnPhotoCover":false},"fallback":{}}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seasonal-salju-v1', 'salju', 1, 'PUBLISHED', '{"schemaVersion":1,"designId":"salju","artworkVersion":1,"assets":{"coverBackground":{"default":{"url":"/themes/seasonal/winter-bg.webp","contentType":"image/webp","width":1024,"height":1536,"sizeBytes":230662}},"coverForeground":{"default":{"url":"/themes/seasonal/winter-fg.webp","contentType":"image/webp","width":960,"height":581,"sizeBytes":274242}}},"presentation":{"backgroundFit":"cover","backgroundPosition":"center-top","foregroundPosition":"bottom-center","foregroundMotion":"breathe","opacity":1,"scale":1,"backgroundLayer":0,"decorationLayer":1,"foregroundLayer":3,"showOnOrnamentCover":true,"showOnPhotoCover":false},"fallback":{}}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "templates" AS t
SET "layoutSchema" = jsonb_set(t."layoutSchema"::jsonb, '{artwork}', v."manifest", true),
    "artworkVersionId" = v."id"
FROM "template_artwork_versions" AS v
WHERE v."designId" IN ('sakura-anime', 'semi', 'gugur', 'salju')
  AND t."layoutSchema"::jsonb -> 'artwork' IS NULL
  AND COALESCE(t."layoutSchema"::jsonb #>> '{theme,motif}', t."layoutSchema"::jsonb #>> '{theme,preset}') = v."designId";
