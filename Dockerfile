# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app
ENV CI=true

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:alpine

RUN sed -i '/^types {/a\    application/manifest+json webmanifest;' /etc/nginx/mime.types

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
