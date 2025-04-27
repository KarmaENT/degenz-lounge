# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
RUN npm install
COPY frontend .
RUN npm run build  # This compiles TypeScript -> Next.js static files

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app/frontend
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
