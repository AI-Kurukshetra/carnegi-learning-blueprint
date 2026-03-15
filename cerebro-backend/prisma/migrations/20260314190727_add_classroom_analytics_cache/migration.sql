-- CreateTable
CREATE TABLE "classroom_analytics_cache" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "generated_by_id" UUID NOT NULL,
    "analytics" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "classroom_analytics_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_classroom_analytics_tenant_classroom" ON "classroom_analytics_cache"("tenant_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_analytics_cache_tenant_id_classroom_id_key" ON "classroom_analytics_cache"("tenant_id", "classroom_id");

-- AddForeignKey
ALTER TABLE "classroom_analytics_cache" ADD CONSTRAINT "classroom_analytics_cache_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_analytics_cache" ADD CONSTRAINT "classroom_analytics_cache_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_analytics_cache" ADD CONSTRAINT "classroom_analytics_cache_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
