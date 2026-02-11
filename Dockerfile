# Stage 1 — Build
FROM node:22-alpine AS builder

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
FROM node:22-alpine AS production

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for workspace resolution
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install production deps only
RUN npm ci --omit=dev

# Remove build tools after native compilation
RUN apk del python3 make g++

# Copy built output from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/client/dist packages/client/dist

# Create data and uploads dirs
RUN mkdir -p /data /uploads && chown -R node:node /data /uploads

USER node

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
