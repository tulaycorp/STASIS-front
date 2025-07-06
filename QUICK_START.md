# STASIS Frontend - Quick Deployment Guide

## 🚀 Deploy to Digital Ocean in 5 Steps

### Prerequisites
- Digital Ocean account
- Domain name (optional but recommended)
- Your backend API URL

### Step 1: Create Digital Ocean Droplet
```bash
# Choose Ubuntu 20.04 LTS
# Minimum: 1GB RAM, 1 vCPU ($6/month)
# Recommended: 2GB RAM, 2 vCPU ($12/month)
```

### Step 2: Setup Server
```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Git
apt update && apt install git nginx certbot python3-certbot-nginx -y
```

### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/stasis.git
cd stasis/frontend

# Configure environment
nano .env.production
# Update REACT_APP_API_BASE_URL with your backend URL

# Update nginx configuration
nano nginx.conf
# Update proxy_pass with your backend URL

# Deploy
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure Domain (Optional)
```bash
# Configure Nginx
nano /etc/nginx/sites-available/stasis

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
ln -s /etc/nginx/sites-available/stasis /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

### Step 5: Verify Deployment
```bash
# Check container status
docker ps

# Test application
curl http://your-domain.com/health
# Should return: healthy

# View logs
docker logs stasis-frontend-container
```

## 🔧 Quick Commands

### Update Application
```bash
cd stasis/frontend
git pull
./deploy.sh
```

### Check Status
```bash
docker ps | grep stasis
docker logs stasis-frontend-container
```

### Restart Application
```bash
docker restart stasis-frontend-container
```

## 🛠️ Troubleshooting

### Container won't start
```bash
docker logs stasis-frontend-container
# Check for build errors or missing files
```

### Can't access application
```bash
# Check if container is running
docker ps

# Check nginx status
systemctl status nginx

# Check firewall
ufw status
```

### SSL issues
```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

## 📱 Access Your Application

- **HTTP**: `http://your-droplet-ip`
- **HTTPS**: `https://your-domain.com` (if SSL configured)
- **Health Check**: `http://your-domain.com/health`

## 💡 Tips

1. **Point your domain to the droplet IP** before running certbot
2. **Update firewall** to allow ports 80 and 443
3. **Monitor logs** regularly for any issues
4. **Set up automatic backups** in Digital Ocean
5. **Use a CDN** like Cloudflare for better performance

## 🔒 Security Checklist

- ✅ SSL certificate installed
- ✅ Firewall configured (ports 22, 80, 443)
- ✅ Regular updates scheduled
- ✅ Strong passwords used
- ✅ SSH key authentication enabled

## 📞 Support

If you encounter issues:
1. Check the logs: `docker logs stasis-frontend-container`
2. Verify environment variables in `.env.production`
3. Test backend connectivity from the server
4. Review the full DEPLOYMENT.md guide

---

**Total deployment time: ~15 minutes** ⏱️
