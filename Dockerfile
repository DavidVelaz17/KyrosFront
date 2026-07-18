# syntax=docker/dockerfile:1

# Nota: "slim" (Debian/glibc) en vez de "alpine" (musl) — los paquetes nativos de Tailwind v4
# (@tailwindcss/oxide) no resuelven bien sus binarios opcionales contra musl en algunas combinaciones
# de plataforma, y falla `npm ci` dentro del contenedor aunque el lockfile esté bien.

# ---- deps stage ----
# Capa aparte solo para node_modules: si package-lock.json no cambia, Docker la reusa cacheada
# aunque sí haya cambiado el código, acelerando builds repetidos.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BACKEND_API_URL solo se usa en runtime (funciones "use server"), no en build time — no hace
# falta pasarlo aquí como build arg.
RUN npm run build

# ---- runtime stage ----
# Imagen final: solo el build "standalone" (ver next.config.ts) + los estáticos. Sin el resto
# del repo, sin devDependencies, sin el código fuente sin compilar.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
