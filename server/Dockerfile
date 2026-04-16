# Stage 1: Build the Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev tools)
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client before copying the rest of the source
# This allows for better layer caching when source code changes
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy required files from the builder
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Keep the container running on standard StackPilot port
EXPOSE 5000

# Triggers database schema migrations, and boots the NestJS app
CMD ["npm", "run", "start:prod:migrate"]
