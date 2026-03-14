#!/bin/sh
set -e

echo "=== Cerebro Container Starting ==="

# Run Prisma migrations against the production database
echo "[..] Running database migrations..."
cd /app/backend
npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "[OK] Migrations applied"

# Start Nginx + NestJS via supervisor
echo "[..] Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
