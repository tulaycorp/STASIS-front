# Multi-stage build for React frontend with Nginx
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install certbot for SSL certificates
RUN apk add --no-cache certbot certbot-nginx

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Create directories for SSL certificates and certbot
RUN mkdir -p /etc/letsencrypt/live/stasis-edu.tech
RUN mkdir -p /var/www/certbot
RUN mkdir -p /var/log/nginx

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from build stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create health check script
RUN echo '#!/bin/sh' > /usr/local/bin/health-check.sh && \
    echo 'curl -f http://localhost/health || exit 1' >> /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

# Expose ports
EXPOSE 80 443

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
