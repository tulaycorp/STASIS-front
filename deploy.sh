#!/bin/bash

# STASIS Frontend Deployment Script for Digital Ocean
# This script builds and deploys the React frontend

set -e

echo "🚀 Starting STASIS Frontend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="stasis-frontend"
CONTAINER_NAME="stasis-frontend-container"
PORT=3000

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $IMAGE_NAME .

echo -e "${YELLOW}🛑 Stopping existing container (if any)...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo -e "${YELLOW}🚀 Starting new container...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Frontend is now running on port $PORT${NC}"
echo -e "${GREEN}📊 Check status: docker ps | grep $CONTAINER_NAME${NC}"
echo -e "${GREEN}📋 View logs: docker logs $CONTAINER_NAME${NC}"
