-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_teacher_id_fkey";

-- AlterTable
ALTER TABLE "classrooms" ALTER COLUMN "subject_id" DROP NOT NULL,
ALTER COLUMN "teacher_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
