# ==========================
# 1. Builder Stage
# ==========================
FROM node:22-alpine AS builder

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat postgresql-client

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies first (better cache layer)
RUN yarn --frozen-lockfile --production=false

# Copy schema files for code generation
COPY prisma ./prisma/
COPY zenstack ./zenstack/
COPY .env* ./

# Generate Prisma and ZenStack code
RUN yarn zenstack generate

# Copy source code
COPY . .

# Build all applications in parallel for faster builds
RUN yarn build:all

# ==========================
# 2. Production Base Stage (DRY)
# ==========================
FROM node:22-alpine AS production-base

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Copy built artifacts from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nestjs:nodejs /app/.env* ./

# Switch to non-root user
USER nestjs

# ==========================
# 3. API Stage
# ==========================
FROM production-base AS api

EXPOSE 3000

# Use direct node command for better performance
CMD ["node", "dist/apps/api/main"]

# ==========================
# 4. Worker Stage
# ==========================
FROM production-base AS worker

# Use direct node command for better performance
CMD ["node", "dist/apps/worker/main"]

# ==========================
# 5. CLI Stage
# ==========================
FROM production-base AS cli

# Use direct node command for better performance
CMD ["node", "dist/apps/cli/main"]
