# Stage 1: Build the Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev tools)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Generate Prisma Client and build the code
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy required files from the builder
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Keep the container running on standard Nest port
EXPOSE 3000

# Triggers database schema migrations, and boots the NestJS app
CMD ["npm", "run", "start:prod:migrate"]
