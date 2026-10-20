FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc tsconfig.base.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
RUN npm ci --workspace @bustit/server --include-workspace-root

COPY packages/engine ./packages/engine
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

RUN npm run build -w @bustit/engine -w @bustit/shared -w @bustit/server

FROM builder AS migrate

WORKDIR /app/packages/server

ENV NODE_ENV=production

CMD ["npx", "drizzle-kit", "migrate"]

FROM node:24-alpine AS server

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    LOG_DIR=/var/log/bustit

RUN addgroup -S app && adduser -S -G app app \
    && mkdir -p /var/log/bustit && chown app:app /var/log/bustit

COPY package.json package-lock.json .npmrc ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
RUN npm ci --omit=dev --workspace @bustit/server

COPY --from=builder /app/packages/engine/dist ./packages/engine/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist

VOLUME ["/var/log/bustit"]

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "packages/server/dist/main.js"]
