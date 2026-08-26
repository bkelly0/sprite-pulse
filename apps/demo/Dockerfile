# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_ENABLE_PROXY=false
ARG NEXT_GO_PRIVATE_BACKEND_URL=http://localhost:8080
ARG GCP_BACKEND_AUTH_ENABLED=false
ENV NEXT_ENABLE_PROXY=$NEXT_ENABLE_PROXY
ENV NEXT_GO_PRIVATE_BACKEND_URL=$NEXT_GO_PRIVATE_BACKEND_URL
ENV GCP_BACKEND_AUTH_ENABLED=$GCP_BACKEND_AUTH_ENABLED

# Copy workspace manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY apps/demo/package.json ./apps/demo/package.json
COPY packages/sprite-pulse/package.json ./packages/sprite-pulse/package.json

# Install all workspace dependencies, including local workspace links.
RUN npm ci

# Copy source and build the workspace packages needed by the demo.
COPY . .
RUN npm run build -w @bkelly0/sprite-pulse && npm run build -w demo

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies only.
COPY package.json package-lock.json ./
COPY apps/demo/package.json ./apps/demo/package.json
COPY packages/sprite-pulse/package.json ./packages/sprite-pulse/package.json
RUN npm ci --omit=dev

# Copy the built Next.js app and runtime assets.
COPY --from=build /app/apps/demo/.next ./apps/demo/.next
COPY --from=build /app/apps/demo/public ./apps/demo/public
COPY --from=build /app/apps/demo/server.mjs ./apps/demo/server.mjs
COPY --from=build /app/apps/demo/next.config.mjs ./apps/demo/next.config.mjs
COPY --from=build /app/packages/sprite-pulse ./packages/sprite-pulse

WORKDIR /app/apps/demo
EXPOSE 4000
CMD ["node", "server.mjs"]
