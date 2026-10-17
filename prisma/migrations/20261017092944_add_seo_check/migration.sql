-- CreateTable
CREATE TABLE "SeoCheck" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeoCheck_normalizedUrl_createdAt_idx" ON "SeoCheck"("normalizedUrl", "createdAt");

-- AddForeignKey
ALTER TABLE "SeoCheck" ADD CONSTRAINT "SeoCheck_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
