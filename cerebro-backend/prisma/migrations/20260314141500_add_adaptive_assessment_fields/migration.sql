-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "adaptive_state" JSONB,
ADD COLUMN     "analytics" JSONB;

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "adaptive_config" JSONB,
ADD COLUMN     "is_adaptive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "attempt_responses" ADD COLUMN     "sequence_order" INTEGER,
ADD COLUMN     "served_difficulty" TEXT;

-- CreateIndex
CREATE INDEX "idx_questions_adaptive_pool" ON "questions"("tenant_id", "difficulty_level", "review_status");
