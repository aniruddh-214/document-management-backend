# Stage 1: Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies separately to leverage cache
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies (production + dev)
RUN pnpm install

# Copy source files
COPY . .

# Build the app
RUN pnpm build

# Stage 2: Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm globally again
RUN npm install -g pnpm

# Copy only the production dependencies from lockfile
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod

# Copy build output from builder stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files (e.g. prisma client if used, or assets)

# Set environment variables or default values if needed
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
