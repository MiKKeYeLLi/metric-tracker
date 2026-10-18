-- CreateEnum
CREATE TYPE "DirectoryStatus" AS ENUM ('NotSubmitted', 'PendingReview', 'NeedsChanges', 'Live', 'Rejected');

-- CreateEnum
CREATE TYPE "DirectoryPriority" AS ENUM ('High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "Directory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "status" "DirectoryStatus" NOT NULL DEFAULT 'NotSubmitted',
    "priority" "DirectoryPriority" NOT NULL DEFAULT 'Medium',
    "dateSubmitted" DATE,
    "listingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryActivity" (
    "id" TEXT NOT NULL,
    "directoryId" TEXT,
    "directoryName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "DirectoryStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectoryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryChecklistItem" (
    "id" TEXT NOT NULL,
    "directoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Directory_status_idx" ON "Directory"("status");

-- CreateIndex
CREATE INDEX "DirectoryActivity_createdAt_idx" ON "DirectoryActivity"("createdAt");

-- CreateIndex
CREATE INDEX "DirectoryChecklistItem_directoryId_position_idx" ON "DirectoryChecklistItem"("directoryId", "position");

-- AddForeignKey
ALTER TABLE "DirectoryActivity" ADD CONSTRAINT "DirectoryActivity_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "Directory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectoryChecklistItem" ADD CONSTRAINT "DirectoryChecklistItem_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "Directory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

