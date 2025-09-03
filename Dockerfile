# ==============================================================================
# Etapa 1: "Builder" - Instala dependencias y construye la aplicación
# ==============================================================================
FROM node:18-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias
# Esto aprovecha el caché de Docker. Si no cambian, no se reinstala todo.
COPY package*.json ./

# Instala todas las dependencias (incluyendo las de desarrollo para el build)
RUN npm install

# Copia el resto del código fuente de la aplicación
COPY . .

# Ejecuta el script de construcción de Next.js
RUN npm run build

# ==============================================================================
# Etapa 2: "Runner" - Prepara la imagen final de producción
# ==============================================================================
FROM node:18-alpine AS runner

WORKDIR /app

# Establece el entorno a producción
ENV NODE_ENV=production

# Crea un usuario y grupo no-root para mayor seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia los artefactos de la compilación desde la etapa "builder"
# Se usa la salida "standalone" de Next.js para una imagen mínima.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambia al usuario no-root
USER nextjs

# Expone el puerto en el que corre la aplicación Next.js
EXPOSE 3000

# El comando para iniciar el servidor de Next.js en producción
CMD ["node", "server.js"]