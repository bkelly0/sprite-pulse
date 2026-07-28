# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY apps/playground/package.json ./apps/playground/package.json
COPY packages/sprite-pulse/package.json ./packages/sprite-pulse/package.json

# Install all workspace dependencies, including local workspace links.
RUN npm ci

# Copy source and build the workspace packages needed by the playground.
COPY . .
RUN npm run build -w sprite-pulse && npm run build -w playground

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies only.
COPY package.json package-lock.json ./
COPY apps/playground/package.json ./apps/playground/package.json
COPY packages/sprite-pulse/package.json ./packages/sprite-pulse/package.json
RUN npm ci --omit=dev

# Copy the built Next.js app and runtime assets.
COPY --from=build /app/apps/playground/.next ./apps/playground/.next
COPY --from=build /app/apps/playground/public ./apps/playground/public
COPY --from=build /app/apps/playground/server.mjs ./apps/playground/server.mjs
COPY --from=build /app/apps/playground/next.config.mjs ./apps/playground/next.config.mjs
COPY --from=build /app/packages/sprite-pulse ./packages/sprite-pulse

WORKDIR /app/apps/playground
EXPOSE 4000
CMD ["node", "server.mjs"]
