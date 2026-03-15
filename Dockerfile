# ============================================================
# Cerebro — Single Cloud Run Container
# NestJS serves both API + React static files
# ============================================================

# ---- Stage 1: Build React client ----
FROM node:20-alpine AS client-build

WORKDIR /app/cerebro-client

COPY cerebro-client/package.json cerebro-client/package-lock.json ./
RUN npm ci

COPY cerebro-client/ ./

# Override API base URL to use relative path (same origin)
RUN echo "VITE_USE_MOCK=false" > .env.production && \
    echo "VITE_MOCK_DELAY_MS=0" >> .env.production && \
    echo "VITE_API_BASE_URL=/api/v1" >> .env.production && \
    echo "VITE_APP_PHASE=1" >> .env.production

RUN npm run build


# ---- Stage 2: Build NestJS backend ----
FROM node:20-alpine AS backend-build

WORKDIR /app/cerebro-backend

COPY cerebro-backend/package.json cerebro-backend/package-lock.json ./
RUN npm ci

COPY cerebro-backend/ ./

# Generate Prisma client
RUN npx prisma generate

RUN npm run build


# ---- Stage 3: Production image ----
FROM node:20-alpine AS production

WORKDIR /app/backend

# --- Backend ---
COPY --from=backend-build /app/cerebro-backend/dist ./dist
COPY --from=backend-build /app/cerebro-backend/node_modules ./node_modules
COPY --from=backend-build /app/cerebro-backend/package.json ./package.json
COPY --from=backend-build /app/cerebro-backend/prisma ./prisma

# Copy production env into the container
COPY cerebro-backend/.env.production ./.env.production
COPY cerebro-backend/.env.production ./.env

# --- Frontend (static files served by NestJS serve-static) ---
COPY --from=client-build /app/cerebro-client/dist ./public

# --- Entrypoint script (runs migrations then starts Node) ---
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
