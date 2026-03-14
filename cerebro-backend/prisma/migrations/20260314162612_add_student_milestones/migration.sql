-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "student_milestones" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "due_date" DATE,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "student_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_milestones_tenant_student" ON "student_milestones"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_milestones_tenant_classroom" ON "student_milestones"("tenant_id", "classroom_id");

-- CreateIndex
CREATE INDEX "idx_milestones_tenant_student_status" ON "student_milestones"("tenant_id", "student_id", "status");

-- AddForeignKey
ALTER TABLE "student_milestones" ADD CONSTRAINT "student_milestones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_milestones" ADD CONSTRAINT "student_milestones_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_milestones" ADD CONSTRAINT "student_milestones_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_milestones" ADD CONSTRAINT "student_milestones_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
