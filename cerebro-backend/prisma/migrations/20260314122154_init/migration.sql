-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "BloomLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MULTI_SELECT', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'EXAM', 'PRACTICE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- CreateEnum
CREATE TYPE "TelemetryEventType" AS ENUM ('ASSESSMENT_STARTED', 'QUESTION_VIEWED', 'OPTION_SELECTED', 'HINT_REQUESTED', 'ASSESSMENT_SUBMITTED', 'SESSION_STARTED', 'SESSION_ENDED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "logo_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level_number" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subject_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bloom_level" "BloomLevel" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lo_prerequisites" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source_lo_id" UUID NOT NULL,
    "target_lo_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lo_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_standards" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "competency_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lo_competency_mappings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "learning_objective_id" UUID NOT NULL,
    "competency_standard_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lo_competency_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "learning_objective_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stem" TEXT NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "bloom_level" "BloomLevel" NOT NULL,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "hints" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "rationale" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "due_at" TIMESTAMPTZ,
    "time_limit_minutes" INTEGER,
    "has_randomized_questions" BOOLEAN NOT NULL DEFAULT false,
    "total_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "score" DOUBLE PRECISION,
    "total_marks" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_responses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text_response" TEXT,
    "is_correct" BOOLEAN,
    "marks_awarded" DOUBLE PRECISION,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "ai_score_suggestion" DOUBLE PRECISION,
    "ai_confidence" DOUBLE PRECISION,
    "teacher_override_score" DOUBLE PRECISION,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "hint_level_used" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attempt_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_response_selections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "attempt_response_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_response_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "event_type" "TelemetryEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_states" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "learning_objective_id" UUID NOT NULL,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "forgetting_index" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ,
    "next_review_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "knowledge_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hint_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "hint_level" INTEGER NOT NULL,
    "hint_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hint_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_tenant_id" ON "refresh_tokens"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_users_tenant_id" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_users_tenant_role" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE INDEX "idx_users_tenant_is_active" ON "users"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "school_profiles_tenant_id_key" ON "school_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_school_profiles_tenant_id" ON "school_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_academic_years_tenant_id" ON "academic_years"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_academic_years_tenant_is_active" ON "academic_years"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_grades_tenant_id" ON "grades"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_grades_tenant_academic_year" ON "grades"("tenant_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "idx_grades_tenant_level_number" ON "grades"("tenant_id", "level_number");

-- CreateIndex
CREATE INDEX "idx_sections_tenant_id" ON "sections"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_sections_tenant_grade" ON "sections"("tenant_id", "grade_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_tenant_id" ON "classrooms"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_tenant_teacher" ON "classrooms"("tenant_id", "teacher_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_tenant_section" ON "classrooms"("tenant_id", "section_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_tenant_academic_year" ON "classrooms"("tenant_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "idx_classrooms_tenant_subject" ON "classrooms"("tenant_id", "subject_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_tenant_id" ON "student_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_tenant_student" ON "student_enrollments"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_tenant_section" ON "student_enrollments"("tenant_id", "section_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_tenant_academic_year" ON "student_enrollments"("tenant_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_tenant_id_student_id_section_id_academi_key" ON "student_enrollments"("tenant_id", "student_id", "section_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "idx_teacher_subject_tenant_teacher" ON "teacher_subject_assignments"("tenant_id", "teacher_id");

-- CreateIndex
CREATE INDEX "idx_teacher_subject_tenant_subject" ON "teacher_subject_assignments"("tenant_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subject_assignments_tenant_id_teacher_id_subject_id_key" ON "teacher_subject_assignments"("tenant_id", "teacher_id", "subject_id");

-- CreateIndex
CREATE INDEX "idx_subjects_tenant_id" ON "subjects"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_subjects_tenant_is_active" ON "subjects"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenant_id_code_key" ON "subjects"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "idx_topics_tenant_id" ON "topics"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_topics_tenant_subject" ON "topics"("tenant_id", "subject_id");

-- CreateIndex
CREATE INDEX "idx_topics_tenant_subject_order" ON "topics"("tenant_id", "subject_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_los_tenant_id" ON "learning_objectives"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_los_tenant_topic" ON "learning_objectives"("tenant_id", "topic_id");

-- CreateIndex
CREATE INDEX "idx_los_tenant_bloom_level" ON "learning_objectives"("tenant_id", "bloom_level");

-- CreateIndex
CREATE INDEX "idx_lo_prerequisites_tenant_id" ON "lo_prerequisites"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_lo_prerequisites_tenant_source" ON "lo_prerequisites"("tenant_id", "source_lo_id");

-- CreateIndex
CREATE INDEX "idx_lo_prerequisites_tenant_target" ON "lo_prerequisites"("tenant_id", "target_lo_id");

-- CreateIndex
CREATE UNIQUE INDEX "lo_prerequisites_tenant_id_source_lo_id_target_lo_id_key" ON "lo_prerequisites"("tenant_id", "source_lo_id", "target_lo_id");

-- CreateIndex
CREATE INDEX "idx_competency_standards_tenant_id" ON "competency_standards"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "competency_standards_tenant_id_code_key" ON "competency_standards"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "idx_lo_competency_mappings_tenant_id" ON "lo_competency_mappings"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_lo_competency_mappings_tenant_lo" ON "lo_competency_mappings"("tenant_id", "learning_objective_id");

-- CreateIndex
CREATE INDEX "idx_lo_competency_mappings_tenant_cs" ON "lo_competency_mappings"("tenant_id", "competency_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "lo_competency_mappings_tenant_id_learning_objective_id_comp_key" ON "lo_competency_mappings"("tenant_id", "learning_objective_id", "competency_standard_id");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_id" ON "questions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_lo" ON "questions"("tenant_id", "learning_objective_id");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_type" ON "questions"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_difficulty" ON "questions"("tenant_id", "difficulty_level");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_review_status" ON "questions"("tenant_id", "review_status");

-- CreateIndex
CREATE INDEX "idx_questions_tenant_bloom_level" ON "questions"("tenant_id", "bloom_level");

-- CreateIndex
CREATE INDEX "idx_question_options_tenant_id" ON "question_options"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_question_options_tenant_question" ON "question_options"("tenant_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_question_options_tenant_question_order" ON "question_options"("tenant_id", "question_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_assessments_tenant_id" ON "assessments"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_assessments_tenant_classroom" ON "assessments"("tenant_id", "classroom_id");

-- CreateIndex
CREATE INDEX "idx_assessments_tenant_status" ON "assessments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_assessments_tenant_type" ON "assessments"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "idx_assessments_tenant_classroom_status" ON "assessments"("tenant_id", "classroom_id", "status");

-- CreateIndex
CREATE INDEX "idx_assessment_questions_tenant_id" ON "assessment_questions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_assessment_questions_tenant_assessment" ON "assessment_questions"("tenant_id", "assessment_id");

-- CreateIndex
CREATE INDEX "idx_assessment_questions_tenant_assessment_order" ON "assessment_questions"("tenant_id", "assessment_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_tenant_id_assessment_id_question_id_key" ON "assessment_questions"("tenant_id", "assessment_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_assessment_attempts_tenant_id" ON "assessment_attempts"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_assessment_attempts_tenant_assessment" ON "assessment_attempts"("tenant_id", "assessment_id");

-- CreateIndex
CREATE INDEX "idx_assessment_attempts_tenant_student" ON "assessment_attempts"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_assessment_attempts_tenant_assessment_student" ON "assessment_attempts"("tenant_id", "assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_assessment_attempts_tenant_status" ON "assessment_attempts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_attempt_responses_tenant_id" ON "attempt_responses"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_attempt_responses_tenant_attempt" ON "attempt_responses"("tenant_id", "attempt_id");

-- CreateIndex
CREATE INDEX "idx_attempt_responses_tenant_question" ON "attempt_responses"("tenant_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_attempt_responses_tenant_attempt_question" ON "attempt_responses"("tenant_id", "attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_responses_tenant_id_attempt_id_question_id_key" ON "attempt_responses"("tenant_id", "attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_response_selections_tenant_response" ON "attempt_response_selections"("tenant_id", "attempt_response_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_response_selections_tenant_id_attempt_response_id_o_key" ON "attempt_response_selections"("tenant_id", "attempt_response_id", "option_id");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_id" ON "telemetry_events"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_student" ON "telemetry_events"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_session" ON "telemetry_events"("tenant_id", "session_id");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_event_type" ON "telemetry_events"("tenant_id", "event_type");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_occurred_at" ON "telemetry_events"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_telemetry_events_tenant_student_time" ON "telemetry_events"("tenant_id", "student_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_knowledge_states_tenant_id" ON "knowledge_states"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_states_tenant_student" ON "knowledge_states"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_states_tenant_lo" ON "knowledge_states"("tenant_id", "learning_objective_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_states_tenant_student_mastery" ON "knowledge_states"("tenant_id", "student_id", "mastery_score");

-- CreateIndex
CREATE INDEX "idx_knowledge_states_tenant_next_review" ON "knowledge_states"("tenant_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_states_tenant_id_student_id_learning_objective_id_key" ON "knowledge_states"("tenant_id", "student_id", "learning_objective_id");

-- CreateIndex
CREATE INDEX "idx_hint_requests_tenant_id" ON "hint_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_hint_requests_tenant_student" ON "hint_requests"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_hint_requests_tenant_attempt" ON "hint_requests"("tenant_id", "attempt_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_assignments" ADD CONSTRAINT "teacher_subject_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_prerequisites" ADD CONSTRAINT "lo_prerequisites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_prerequisites" ADD CONSTRAINT "lo_prerequisites_source_lo_id_fkey" FOREIGN KEY ("source_lo_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_prerequisites" ADD CONSTRAINT "lo_prerequisites_target_lo_id_fkey" FOREIGN KEY ("target_lo_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_standards" ADD CONSTRAINT "competency_standards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_competency_mappings" ADD CONSTRAINT "lo_competency_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_competency_mappings" ADD CONSTRAINT "lo_competency_mappings_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_competency_mappings" ADD CONSTRAINT "lo_competency_mappings_competency_standard_id_fkey" FOREIGN KEY ("competency_standard_id") REFERENCES "competency_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_response_selections" ADD CONSTRAINT "attempt_response_selections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_response_selections" ADD CONSTRAINT "attempt_response_selections_attempt_response_id_fkey" FOREIGN KEY ("attempt_response_id") REFERENCES "attempt_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_response_selections" ADD CONSTRAINT "attempt_response_selections_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_states" ADD CONSTRAINT "knowledge_states_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_states" ADD CONSTRAINT "knowledge_states_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_states" ADD CONSTRAINT "knowledge_states_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_requests" ADD CONSTRAINT "hint_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_requests" ADD CONSTRAINT "hint_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
