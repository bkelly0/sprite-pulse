# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY apps/playground/package.json ./apps/playground/package.json
COPY packages/sprite-pulse/package.json ./packages/sprite-pulse/package.json

# Install all workspace dependencies, including local workspace links.
RUN npm ci

# Copy source and build only the playground workspace.
COPY . .
RUN npm run build -w playground

FROM nginx:1.27-alpine AS runtime

# Serve the Vite build output from nginx.
COPY --from=build /app/apps/playground/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
