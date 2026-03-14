-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_generation_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "learning_objective_id" UUID NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "count" INTEGER NOT NULL,
    "result_question_ids" UUID[],
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "question_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_tenant_id_created_at_idx" ON "ai_usage_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_tenant_id_feature_idx" ON "ai_usage_logs"("tenant_id", "feature");

-- CreateIndex
CREATE INDEX "question_generation_jobs_tenant_id_status_idx" ON "question_generation_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "question_generation_jobs_created_by_id_idx" ON "question_generation_jobs"("created_by_id");

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_generation_jobs" ADD CONSTRAINT "question_generation_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_generation_jobs" ADD CONSTRAINT "question_generation_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_generation_jobs" ADD CONSTRAINT "question_generation_jobs_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
