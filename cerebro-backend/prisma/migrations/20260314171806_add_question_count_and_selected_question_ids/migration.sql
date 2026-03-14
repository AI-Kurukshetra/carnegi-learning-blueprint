-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "selected_question_ids" JSONB;

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "question_count" INTEGER;
