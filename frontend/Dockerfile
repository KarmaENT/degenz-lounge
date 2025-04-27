# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci && \
    npm install -D typescript @types/react @types/node @supabase/supabase-js

# Copy and modify tsconfig.json
COPY tsconfig.json .
RUN sed -i 's/"target": "es5"/"target": "es2017"/g' tsconfig.json && \
    sed -i 's/"lib": \[.*\]/"lib": ["dom", "dom.iterable", "es2017", "esnext"]/g' tsconfig.json && \
    sed -i 's/"moduleResolution": "bundler"/"moduleResolution": "node"/g' tsconfig.json && \
    echo "Added downlevelIteration option" && \
    sed -i '/"strict": true,/a \    "downlevelIteration": true,' tsconfig.json

# Copy other config files
COPY next-env.d.ts .
COPY src/types/ ./src/types/
COPY src/lib/supabase.ts ./src/lib/

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies and config
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/tsconfig.json .
COPY --from=deps /app/next-env.d.ts .
COPY --from=deps /app/src/types/ ./src/types/
COPY --from=deps /app/src/lib/ ./src/lib/

# Copy application code
COPY . .

# Verify tsconfig changes
RUN cat tsconfig.json && \
    npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
