# Use Node.js LTS version
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy project files
COPY . .

# Build-time arguments (ARG) - only needed at build time
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SWAGGER_URL=/swagger/

# Variables needed at build time (converted from ARG to ENV)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SWAGGER_URL=${NEXT_PUBLIC_SWAGGER_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Indicate Docker environment for next.config.js
ENV DOCKER_ENV=true

# Build the application
RUN pnpm build

# Production image - use alpine for smaller image size
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Runtime environment variables (ENV)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for health checks
RUN apk add --no-cache curl

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Start the application in standalone mode
CMD ["node", "server.js"]
