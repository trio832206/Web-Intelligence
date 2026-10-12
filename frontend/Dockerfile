# ──────────────────────────────────────────────────────────────
# Frontend Dockerfile — multi-stage: build with Vite, serve with nginx
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing: all unknown paths → index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
