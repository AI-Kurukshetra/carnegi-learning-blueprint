# ============================================================
# Cerebro — Single Cloud Run Container
# Serves React (Nginx) + NestJS (Node) behind Nginx reverse proxy
# ============================================================

# ---- Stage 1: Build React client ----
FROM node:20-alpine AS client-build

WORKDIR /app/cerebro-client

COPY cerebro-client/package.json cerebro-client/package-lock.json ./
RUN npm ci

COPY cerebro-client/ ./

# Copy production env so Vite bakes VITE_* vars into the build
COPY cerebro-client/.env.production .env.production

# Override API base URL to use relative path (same origin, proxied by Nginx)
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

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# --- Backend ---
COPY --from=backend-build /app/cerebro-backend/dist ./backend/dist
COPY --from=backend-build /app/cerebro-backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/cerebro-backend/package.json ./backend/package.json
COPY --from=backend-build /app/cerebro-backend/prisma ./backend/prisma

# Copy production env into the container
COPY cerebro-backend/.env.production ./backend/.env.production
COPY cerebro-backend/.env.production ./backend/.env

# --- Frontend (static files) ---
COPY --from=client-build /app/cerebro-client/dist ./frontend

# --- Nginx config ---
COPY nginx.conf /etc/nginx/nginx.conf

# --- Supervisor config (runs both Nginx + Node) ---
COPY supervisord.conf /etc/supervisord.conf

# --- Entrypoint script (runs migrations then starts services) ---
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
