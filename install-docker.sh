#!/bin/bash

# Quick Docker installation script for Digital Ocean droplet
# Run this on your droplet to install Docker

echo "🐳 Installing Docker on your Digital Ocean droplet..."

# Update system
apt update && apt upgrade -y

# Install Docker using the official installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group (if not root)
if [ "$USER" != "root" ]; then
    usermod -aG docker $USER
    echo "⚠️  You need to logout and login again to use Docker without sudo"
fi

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
echo "✅ Docker installation completed!"
echo "🔍 Verifying Docker installation..."
docker --version
docker-compose --version

echo "🚀 Docker is ready! You can now run ./deploy.sh"
