# Use Node.js LTS version
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Set build-time environment variables (can be overridden at build time)
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SWAGGER_URL=/swagger/
ARG DOCKER_ENV=true
ARG BACKEND_URL=http://backend:8000

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SWAGGER_URL=${NEXT_PUBLIC_SWAGGER_URL}
ENV DOCKER_ENV=${DOCKER_ENV}
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set up development build (for source map support)
RUN npm run build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

# Copy necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_ENV=true
ENV BACKEND_URL=http://backend:8000
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_SWAGGER_URL=/swagger/

# Install curl for health checks
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Start the application in standalone mode
CMD ["node", "server.js"]