# Use the official Node.js 22 image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create data directory
RUN mkdir -p /app/data

# Make port configurable via environment variable
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/gamelog.db"
EXPOSE $PORT

# Build the application
RUN npm run build

# Start the application
CMD ["sh", "-c", "npx prisma db push && npm start"]