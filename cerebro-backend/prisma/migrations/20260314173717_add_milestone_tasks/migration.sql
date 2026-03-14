-- CreateTable
CREATE TABLE "milestone_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "completion_pct" INTEGER,
    "teacher_comment" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "milestone_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_milestone_tasks_tenant_milestone" ON "milestone_tasks"("tenant_id", "milestone_id");

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "student_milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
