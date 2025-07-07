# Multi-stage build for React frontend with Nginx
FROM node:18-alpine as build

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

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy built React app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create directory for SSL certificates
RUN mkdir -p /etc/letsencrypt

# Copy SSL setup script
COPY ssl-setup.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/ssl-setup.sh

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
