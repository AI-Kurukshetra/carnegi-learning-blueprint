-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('FIXED', 'ADAPTIVE', 'SEMI_ADAPTIVE');

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "mode" "AssessmentMode" NOT NULL DEFAULT 'FIXED';
