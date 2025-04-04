# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
RUN pnpm install

# Copy project files (when building the image)
COPY . .

# Build-time arguments
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SWAGGER_URL=/swagger/

# Environment variables
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SWAGGER_URL=${NEXT_PUBLIC_SWAGGER_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development
ENV DOCKER_ENV=true
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean

# Expose the port the app runs on
EXPOSE 3000

# Start Next.js development server
CMD ["pnpm", "run", "dev"]
