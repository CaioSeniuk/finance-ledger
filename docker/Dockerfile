# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# `npm ci` runs the postinstall hook (prisma generate); schema + dev deps must
# already be present in this stage for the client to be generated.
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Skip lifecycle scripts: the Prisma CLI is a dev dependency and the client is
# already compiled into ./dist from the builder stage.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]