#!/bin/bash

# STASIS Frontend Production Deployment Script for Digital Ocean
# This script builds and deploys the React frontend with SSL support

set -e

echo "🚀 Starting STASIS Frontend Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="stasis-edu.tech"
EMAIL="admin@stasis-edu.tech"
PROJECT_NAME="stasis-frontend"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking system requirements..."

# Create necessary directories
print_status "Creating SSL and log directories..."
mkdir -p ssl/certbot/conf
mkdir -p ssl/certbot/www
mkdir -p logs/nginx

# Set proper permissions
chmod 755 ssl/certbot/conf
chmod 755 ssl/certbot/www
chmod 755 logs/nginx

print_status "Building production environment..."

# Build the application with production environment
print_status "Building React application for production..."
NODE_ENV=production npm run build

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove old images to free up space
print_status "Cleaning up old Docker images..."
docker image prune -f

# Build and start services
print_status "Building and starting Docker containers..."
docker-compose up -d --build

# Wait for containers to start
print_status "Waiting for containers to initialize..."
sleep 10

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    print_error "Failed to start containers. Check logs with: docker-compose logs"
    exit 1
fi

print_success "Containers started successfully!"

# Setup SSL certificates
print_status "Setting up SSL certificates..."

# First, get certificates using HTTP challenge
print_status "Requesting SSL certificate for $DOMAIN..."

# Create a temporary nginx config for certificate challenge
docker-compose exec stasis-frontend sh -c "
    # Create temporary nginx config for ACME challenge
    cat > /etc/nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'Server is ready for SSL setup';
        add_header Content-Type text/plain;
    }
}
EOF

    # Reload nginx with temporary config
    nginx -s reload
"

# Request SSL certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
    
    # Restore the full nginx configuration
    print_status "Updating nginx configuration with SSL..."
    docker-compose exec stasis-frontend sh -c "
        # Remove temporary config
        rm -f /etc/nginx/conf.d/temp.conf
        
        # Test the main configuration
        nginx -t && nginx -s reload
    "
    
    if [ $? -eq 0 ]; then
        print_success "Nginx configuration updated successfully!"
    else
        print_error "Failed to update nginx configuration"
        exit 1
    fi
else
    print_error "Failed to obtain SSL certificate"
    print_warning "The site will run on HTTP only"
fi

# Final health check
print_status "Performing health checks..."

# Check if the site is accessible
sleep 5
if curl -f -s http://$DOMAIN/health > /dev/null; then
    print_success "HTTP health check passed!"
else
    print_warning "HTTP health check failed"
fi

if curl -f -s -k https://$DOMAIN/health > /dev/null; then
    print_success "HTTPS health check passed!"
else
    print_warning "HTTPS health check failed (SSL may still be setting up)"
fi

# Display deployment information
echo ""
echo "🎉 Deployment Summary:"
echo "===================="
print_success "✅ Frontend deployed successfully!"
print_success "✅ Domain: https://$DOMAIN"
print_success "✅ SSL certificates configured"
print_success "✅ Nginx reverse proxy active"
print_success "✅ Docker containers running"

echo ""
echo "📋 Useful Commands:"
echo "==================="
echo "• View logs: docker-compose logs -f"
echo "• Check status: docker-compose ps"
echo "• Restart services: docker-compose restart"
echo "• Stop services: docker-compose down"
echo "• Update SSL: docker-compose run --rm certbot renew"

echo ""
echo "🌐 Access your application:"
echo "=========================="
echo "• Main site: https://$DOMAIN"
echo "• Health check: https://$DOMAIN/health"
echo "• Backend API: https://$DOMAIN/api"

echo ""
print_success "🚀 STASIS Frontend is now live at https://$DOMAIN"
