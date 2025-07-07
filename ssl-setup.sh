#!/bin/bash

# SSL Certificate Setup Script for STASIS Frontend
# This script sets up Let's Encrypt SSL certificates for the domain

set -e

DOMAIN="stasis-edu.tech"
EMAIL="admin@stasis-edu.tech"
STAGING=0 # Set to 1 for testing

echo "🔐 Setting up SSL certificates for $DOMAIN..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${GREEN}✅ SSL certificates already exist for $DOMAIN${NC}"
    exit 0
fi

# Create directory for challenge files
mkdir -p /var/www/certbot

echo -e "${YELLOW}📋 Requesting SSL certificate for $DOMAIN...${NC}"

# Determine if we should use staging or production
if [ $STAGING -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Using Let's Encrypt staging environment${NC}"
    STAGING_FLAG="--staging"
else
    echo -e "${GREEN}🚀 Using Let's Encrypt production environment${NC}"
    STAGING_FLAG=""
fi

# Request certificate
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_FLAG \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate successfully obtained for $DOMAIN${NC}"
    
    # Test nginx configuration
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
        
        # Reload nginx to use new certificates
        nginx -s reload
        echo -e "${GREEN}✅ Nginx reloaded with new SSL certificates${NC}"
    else
        echo -e "${RED}❌ Nginx configuration test failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 SSL setup completed successfully!${NC}"
echo -e "${GREEN}🌐 Your site should now be accessible at https://$DOMAIN${NC}"
