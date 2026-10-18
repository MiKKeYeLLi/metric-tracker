-- AlterTable
ALTER TABLE "PressCoverage" ALTER COLUMN "articleType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PressSubmission" ALTER COLUMN "articleType" DROP NOT NULL,
ALTER COLUMN "dateSubmitted" DROP NOT NULL;

