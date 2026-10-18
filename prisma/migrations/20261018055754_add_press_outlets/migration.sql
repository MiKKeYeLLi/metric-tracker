-- CreateEnum
CREATE TYPE "OutletTier" AS ENUM ('Tier1', 'Tier2', 'Tier3');

-- AlterTable
ALTER TABLE "PressCoverage" ADD COLUMN     "outletId" TEXT;

-- AlterTable
ALTER TABLE "PressSubmission" ADD COLUMN     "outletId" TEXT;

-- CreateTable
CREATE TABLE "PressOutlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "tier" "OutletTier",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressOutlet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressOutlet_key_key" ON "PressOutlet"("key");

-- CreateIndex
CREATE INDEX "PressCoverage_outletId_idx" ON "PressCoverage"("outletId");

-- AddForeignKey
ALTER TABLE "PressCoverage" ADD CONSTRAINT "PressCoverage_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "PressOutlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressSubmission" ADD CONSTRAINT "PressSubmission_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "PressOutlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: one outlet per distinct outlet name, matched ignoring case, spaces and punctuation
-- (the same rule as outletKey in src/components/media/press-model.ts). The most recently used
-- spelling becomes the outlet's display name.
WITH names AS (
    SELECT "outlet", "createdAt" FROM "PressCoverage"
    UNION ALL
    SELECT "outlet", "createdAt" FROM "PressSubmission"
), keyed AS (
    SELECT btrim("outlet") AS name,
           lower(regexp_replace("outlet", '[^[:alnum:]]+', '', 'g')) AS key,
           "createdAt"
    FROM names
)
INSERT INTO "PressOutlet" ("id", "name", "key", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, name, key, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (key) name, key
    FROM keyed
    WHERE key <> ''
    ORDER BY key, "createdAt" DESC
) latest;

UPDATE "PressCoverage" c
SET "outletId" = o."id"
FROM "PressOutlet" o
WHERE o."key" = lower(regexp_replace(c."outlet", '[^[:alnum:]]+', '', 'g'));

UPDATE "PressSubmission" s
SET "outletId" = o."id"
FROM "PressOutlet" o
WHERE o."key" = lower(regexp_replace(s."outlet", '[^[:alnum:]]+', '', 'g'));
