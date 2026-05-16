# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/front
# Configure Nginx to serve from /front and fallback to index.html for React Router
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; gzip on; gzip_types text/css application/javascript application/json image/svg+xml; location /front { alias /usr/share/nginx/html/front; try_files $uri $uri/ /front/index.html; } location / { return 301 /front/; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]