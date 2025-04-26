# Development target
FROM node:18-bullseye AS development

RUN apt-get update && apt-get install -y \
    git openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
USER node

# Production target
FROM node:18-bullseye-slim AS production

WORKDIR /app
COPY --from=development /workspace/node_modules ./node_modules
COPY --from=development /workspace/.next ./.next
COPY --from=development /workspace/public ./public
COPY --from=development /workspace/package.json .
COPY --from=development /workspace/prisma ./prisma

RUN apt-get update && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm prune --production

USER node
EXPOSE 3000
CMD ["npm", "start"]
