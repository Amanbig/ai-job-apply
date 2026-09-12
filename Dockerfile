# =========================================================
# Stage 1: Build Frontend (Vite -> HTML, CSS, JS)
# =========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =========================================================
# Stage 2: Build Backend (TypeScript -> JS)
# =========================================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

# =========================================================
# Stage 3: Production Runner
# =========================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production \
    PORT=5000

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend static assets into public directory
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 5000

# Run database push/migrations then start the unified API & Frontend server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
