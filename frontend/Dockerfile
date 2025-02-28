# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]