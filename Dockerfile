
# syntax=docker/dockerfile:1

# ============================================================
# ETAPA 1: Instalacion de dependencias
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ============================================================
# ETAPA 2: Compilacion de Next.js
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN --mount=type=secret,id=production_env,target=/app/.env.production,required=true \
    npm run build

# ============================================================
# ETAPA 3: Imagen final de produccion
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

# Configuracion publica de produccion: solo lectura
RUN if [ -f /app/.env.production ]; then \
        chown root:root /app/.env.production && \
        chmod 444 /app/.env.production; \
    fi

# Directorio de cache con permisos de escritura
RUN mkdir -p /app/.next/cache \
    && chown -R nextjs:nodejs /app/.next/cache

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
