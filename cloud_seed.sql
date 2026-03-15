-- ============================================================
-- Cerebro Cloud Seed — Tenant + Demo Users
-- Idempotent — safe to run multiple times
--
-- Creates tenant if missing, upserts all demo users
--
-- Default credentials:
--   Super Admin:  admin@cerebro.dev        / Admin@123
--   School Admin: schooladmin@cerebro.dev   / SchoolAdmin@123
--   Teacher:      teacher@cerebro.dev       / Teacher@123
--   Student:      student@cerebro.dev       / Student@123
-- ============================================================

BEGIN;

-- Ensure tenant exists
INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Cerebro Demo School',
  'cerebro-demo',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Super Admin (admin@cerebro.dev / Admin@123)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified, created_at, updated_at)
SELECT
  gen_random_uuid(), id, 'admin@cerebro.dev',
  '$2b$10$X.HIAhW3awTVaRm95Z006u3NqOWy4A1xz//UZB0Kb1gDceaVlpiI6',
  'SUPER_ADMIN', 'Super', 'Admin', true, true, NOW(), NOW()
FROM tenants WHERE slug = 'cerebro-demo'
ON CONFLICT (tenant_id, email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

-- School Admin (schooladmin@cerebro.dev / SchoolAdmin@123)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified, created_at, updated_at)
SELECT
  gen_random_uuid(), id, 'schooladmin@cerebro.dev',
  '$2b$10$ey8ryxkoqssYxiX4W3wYheMvhDf553.oTPklZ0Qx/DA7Q4XQ1/xrO',
  'SCHOOL_ADMIN', 'School', 'Admin', true, true, NOW(), NOW()
FROM tenants WHERE slug = 'cerebro-demo'
ON CONFLICT (tenant_id, email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

-- Teacher (teacher@cerebro.dev / Teacher@123)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified, created_at, updated_at)
SELECT
  gen_random_uuid(), id, 'teacher@cerebro.dev',
  '$2b$10$7K0O15IrEQZJvhYnczy7j.pU3a6JpkbHkJkNll/cJa/Rptp1w4eP6',
  'TEACHER', 'Jane', 'Smith', true, true, NOW(), NOW()
FROM tenants WHERE slug = 'cerebro-demo'
ON CONFLICT (tenant_id, email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

-- Student (student@cerebro.dev / Student@123)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified, created_at, updated_at)
SELECT
  gen_random_uuid(), id, 'student@cerebro.dev',
  '$2b$10$dV3cDBqZGXGK1Drgq/Hzs.s5.K.lT3UgHUDVrrKrN/np/Ltuo1kzy',
  'STUDENT', 'John', 'Doe', true, true, NOW(), NOW()
FROM tenants WHERE slug = 'cerebro-demo'
ON CONFLICT (tenant_id, email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

COMMIT;
