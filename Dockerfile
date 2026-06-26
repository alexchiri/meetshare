# Stage 1 — Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files for workspace resolution
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install all deps (including devDependencies for build)
RUN npm ci

# Copy all source
COPY . .

# Build: shared → server → client
RUN npm run build

# Stage 2 — Production
FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy package files for workspace resolution
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install production deps only. Build tools for the better-sqlite3 native
# addon are added in a virtual package and removed in the same layer so they
# never reach the final image.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --omit=dev \
    && apk del .build-deps \
    && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/client/dist packages/client/dist

# Create data and uploads dirs owned by the unprivileged node user
RUN mkdir -p /data /uploads && chown -R node:node /data /uploads

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "packages/server/dist/index.js"]
