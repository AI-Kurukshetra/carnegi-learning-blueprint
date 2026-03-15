-- CreateTable
CREATE TABLE "student_analytics_cache" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "generated_by_id" UUID NOT NULL,
    "analytics" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_analytics_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_analytics_cache_tenant_student" ON "student_analytics_cache"("tenant_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_analytics_cache_tenant_id_student_id_key" ON "student_analytics_cache"("tenant_id", "student_id");

-- AddForeignKey
ALTER TABLE "student_analytics_cache" ADD CONSTRAINT "student_analytics_cache_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_analytics_cache" ADD CONSTRAINT "student_analytics_cache_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_analytics_cache" ADD CONSTRAINT "student_analytics_cache_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
