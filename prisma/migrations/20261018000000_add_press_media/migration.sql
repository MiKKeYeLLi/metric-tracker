-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('NewsArticle', 'Interview', 'FeatureStory', 'PressRelease', 'OpinionCommentary', 'PartnerSponsoredContent', 'BroadcastPodcastAppearance', 'Other');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Draft', 'Submitted', 'UnderReview', 'ChangesRequested', 'Accepted', 'Published', 'Rejected', 'Withdrawn');

-- CreateTable
CREATE TABLE "PressCoverage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "outlet" TEXT NOT NULL,
    "articleType" "ArticleType" NOT NULL,
    "articleTypeOther" TEXT,
    "publishedArticleUrl" TEXT,
    "publicationDate" TIMESTAMP(3),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressSubmission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "outlet" TEXT NOT NULL,
    "articleType" "ArticleType" NOT NULL,
    "articleTypeOther" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'Draft',
    "dateSubmitted" TIMESTAMP(3) NOT NULL,
    "responsiblePerson" TEXT,
    "followUpDate" TIMESTAMP(3),
    "draftUrl" TEXT,
    "publishedArticleUrl" TEXT,
    "notes" TEXT,
    "coverageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PressSubmission" ADD CONSTRAINT "PressSubmission_coverageId_fkey" FOREIGN KEY ("coverageId") REFERENCES "PressCoverage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

