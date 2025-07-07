# Digital Ocean Deployment Guide for STASIS Frontend

## Quick Deployment Steps

### 1. Prepare Your Digital Ocean Droplet

**Create a new droplet:**
- Ubuntu 20.04 or 22.04 LTS
- Minimum: 1GB RAM, 1 vCPU
- Recommended: 2GB RAM, 2 vCPU

**SSH into your droplet:**
```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (Official Docker installation)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx for SSL termination
sudo apt install nginx certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y

# Logout and login again to apply docker group changes
exit
ssh root@YOUR_DROPLET_IP
```

### 3. Deploy Your Frontend

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/STASIS-front.git
cd STASIS-front

# Make deploy script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh
```
### 4. Configure Nginx for SSL and Domain

**Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/stasis
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name stasis-edu.tech www.stasis-edu.tech;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/stasis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Get SSL certificate:**
```bash
sudo certbot --nginx -d stasis-edu.tech -d www.stasis-edu.tech
```

### 5. Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Verification Steps

1. **Check if container is running:**
```bash
docker ps | grep stasis-frontend-container
```

2. **Test the application:**
```bash
curl http://localhost/health
```

3. **Check logs if needed:**
```bash
docker logs stasis-frontend-container
```

## Updating Your Application

When you make changes to your frontend:

```bash
cd STASIS-front
git pull origin main
./deploy.sh
```

## Troubleshooting

**Container won't start:**
```bash
docker logs stasis-frontend-container
```

**Nginx issues:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Restart services:**
```bash
# Restart container
docker restart stasis-frontend-container

# Restart Nginx
sudo systemctl restart nginx
```

## Important Notes

- Your backend is configured to run on IP: 68.183.237.216:8080
- The frontend will proxy API requests to this backend
- Make sure your backend is accessible from your frontend droplet
- SSL certificate will auto-renew via certbot

## Current Configuration

- **Frontend Port:** 80 (inside container)
- **Backend API:** http://68.183.237.216:8080
- **Environment:** Production
- **Source Maps:** Disabled for security

## Next Steps After Deployment

1. Point your domain to your droplet IP
2. Configure SSL with certbot
3. Set up monitoring (optional)
4. Configure backup strategy (optional)

Your STASIS frontend should now be accessible at your domain!
