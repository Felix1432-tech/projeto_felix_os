# ═══════════════════════════════════════════════════════════════════════════
# FELIX OS - Dockerfile
# Multi-stage build para produção otimizada
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev para ts-node do seed)
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
# Compilar o seed separadamente para produção
RUN npx tsc prisma/seed.ts --outDir prisma/dist --esModuleInterop --skipLibCheck

# Stage 3: Production
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl openssl-dev
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma/dist ./prisma/dist

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/dist/seed.js && node dist/main"]
