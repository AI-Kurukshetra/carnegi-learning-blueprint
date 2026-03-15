#!/bin/sh
set -e

echo "=== Cerebro Container Starting ==="

if [ "$DB_SYNC" = "true" ]; then
  # Run Prisma migrations against the production database
  echo "[..] Running database migrations..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
  echo "[OK] Migrations applied"

  # Seed database (upserts are idempotent; create-only records skip on rerun)
  echo "[..] Running database seed..."
  node dist/prisma/seed.js || echo "[WARN] Seed skipped (likely already seeded)"
else
  echo "[SKIP] DB_SYNC is not true — skipping migrations and seed"
fi

# Start NestJS
echo "[..] Starting NestJS server..."
exec node dist/src/main.js
