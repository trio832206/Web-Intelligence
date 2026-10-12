# ──────────────────────────────────────────────────────────────
# Backend Dockerfile
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend

WORKDIR /app

# Install native deps for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 8000

CMD ["node", "src/index.js"]
