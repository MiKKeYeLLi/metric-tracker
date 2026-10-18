-- CreateTable
CREATE TABLE "SavedCopy" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedCopy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedCopy_position_idx" ON "SavedCopy"("position");

