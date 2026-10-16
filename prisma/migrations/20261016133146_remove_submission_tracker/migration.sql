-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_productId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_directoryId_fkey";

-- DropForeignKey
ALTER TABLE "Traffic" DROP CONSTRAINT "Traffic_submissionId_fkey";

-- DropTable
DROP TABLE "Directory";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "Submission";

-- DropTable
DROP TABLE "Traffic";

-- DropEnum
DROP TYPE "SubmissionStatus";

