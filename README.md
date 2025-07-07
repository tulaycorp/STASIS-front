# STASIS Frontend - Digital Ocean Deployment

This repository contains the React frontend for the STASIS Education Management System, configured for production deployment on Digital Ocean with Docker, Nginx, and SSL certificates.

## 🚀 Quick Deployment

### Prerequisites

1. **Digital Ocean Droplet** with Ubuntu 20.04+ 
2. **Domain configured**: `stasis-edu.tech` pointing to your droplet's IP
3. **Docker & Docker Compose** installed on the server
4. **Node.js 18+** for local development

### One-Command Deployment

```bash
chmod +x deploy.sh && ./deploy.sh
```

This script will:
- ✅ Build the React application for production
- ✅ Create Docker containers with Nginx reverse proxy
- ✅ Set up SSL certificates with Let's Encrypt
- ✅ Configure automatic HTTPS redirects
- ✅ Set up automatic SSL renewal

## 📋 Manual Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for building)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <your-repo-url>
cd STASIS-front

# Install dependencies
npm install

# Deploy
./deploy.sh
```

### 3. Verify Deployment

- **Main Site**: https://stasis-edu.tech
- **Health Check**: https://stasis-edu.tech/health
- **API Proxy**: https://stasis-edu.tech/api

## 🏗️ Architecture

```
Internet → Nginx (Port 443/80) → React App (Static Files)
                ↓
         Backend API (68.183.237.216:8080)
```

### Components

- **Frontend**: React app served by Nginx
- **Reverse Proxy**: Nginx handles SSL termination and API proxying
- **SSL**: Let's Encrypt certificates with auto-renewal
- **Backend**: Spring Boot API at 68.183.237.216:8080

## 🔧 Configuration Files

### Environment Variables

Production environment is configured in `.env.production`:

```env
NODE_ENV=production
REACT_APP_API_BASE_URL=https://stasis-edu.tech/api
REACT_APP_DOMAIN=stasis-edu.tech
REACT_APP_PROTOCOL=https
```

### Docker Configuration

- **Dockerfile**: Multi-stage build with Node.js and Nginx
- **docker-compose.yml**: Orchestrates frontend, certbot, and watchtower
- **nginx.conf**: Reverse proxy with SSL and security headers

## 🛠️ Management Commands

### Container Management

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### SSL Certificate Management

```bash
# Renew certificates manually
docker-compose run --rm certbot renew

# Test certificate renewal
docker-compose run --rm certbot renew --dry-run

# View certificate status
docker-compose exec stasis-frontend openssl x509 -in /etc/letsencrypt/live/stasis-edu.tech/fullchain.pem -text -noout
```

### Monitoring

```bash
# Check nginx status
docker-compose exec stasis-frontend nginx -t

# View nginx access logs
docker-compose logs stasis-frontend

# Monitor resource usage
docker stats
```

## 🔒 Security Features

- **SSL/TLS**: Let's Encrypt certificates with automatic renewal
- **Security Headers**: HSTS, X-Frame-Options, CSP, etc.
- **Rate Limiting**: API and login endpoint protection
- **CORS**: Properly configured for domain
- **Firewall**: Only ports 80, 443, and 22 exposed

## 🚨 Troubleshooting

### Common Issues

1. **SSL Certificate Fails**
   ```bash
   # Check DNS propagation
   nslookup stasis-edu.tech
   
   # Verify domain points to server
   curl -I http://stasis-edu.tech
   ```

2. **API Connection Issues**
   ```bash
   # Test backend connectivity
   curl http://68.183.237.216:8080/api/courses
   
   # Check proxy configuration
   docker-compose exec stasis-frontend nginx -T
   ```

3. **Container Won't Start**
   ```bash
   # Check logs
   docker-compose logs stasis-frontend
   
   # Verify configuration
   docker-compose config
   ```

### Log Locations

- **Nginx Logs**: `./logs/nginx/`
- **Container Logs**: `docker-compose logs`
- **SSL Logs**: `docker-compose logs certbot`

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
./deploy.sh
```

### Backup Important Data

```bash
# Backup SSL certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl/

# Backup nginx configuration
cp nginx.conf nginx.conf.backup
```

## 📊 Performance Optimization

- **Gzip Compression**: Enabled for all text assets
- **Browser Caching**: Long-term caching for static assets
- **HTTP/2**: Enabled for improved performance
- **Asset Optimization**: Production build with minification

## 🌐 Domain Configuration

Ensure your domain DNS records are configured:

```
Type: A
Name: @
Value: YOUR_DROPLET_IP

Type: A  
Name: www
Value: YOUR_DROPLET_IP
```

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Verify domain configuration
4. Ensure backend API is accessible

---

**🎉 Your STASIS Frontend is now production-ready with enterprise-grade security and performance!**
