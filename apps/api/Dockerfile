# API NestJS + Prisma. Bangun dari ROOT repo (npm workspaces, lockfile root):
#   docker build -f apps/api/Dockerfile .
# Image runtime sengaja menyimpan node_modules lengkap (termasuk devDependencies): CLI prisma dipakai untuk
# `migrate deploy` saat container start, dan tsx + src/ untuk seed (`docker compose run --rm api npm run prisma:seed`).

FROM node:24-slim AS build
WORKDIR /repo
# package.json semua workspace ikut disalin supaya npm ci bisa mencocokkan lockfile root.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --no-audit --no-fund
COPY apps/api apps/api
WORKDIR /repo/apps/api
# Client Prisma digenerate ke src/generated (di-ignore git & .dockerignore), lalu dikompilasi ke dist/.
RUN npm run prisma:generate && npm run build

FROM node:24-slim
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
USER node
EXPOSE 4000
# Migrasi dulu (idempoten, aman diulang), baru jalankan server. CLI prisma ter-hoist ke node_modules root.
CMD ["sh", "-c", "/repo/node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]
