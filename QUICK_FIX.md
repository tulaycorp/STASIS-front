# Quick Fix for Docker Installation Issue

## Current Problem
You're getting "docker: command not found" because Docker isn't properly installed on your droplet.

## Immediate Solution

**Step 1: Install Docker on your droplet**
```bash
# Run this on your droplet (you're already in ~/STASIS-front)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
```

**Step 2: Verify Docker installation**
```bash
docker --version
```

**Step 3: Now run your deployment**
```bash
# You're already in the right directory with the fixed files
./deploy.sh
```

## What I Fixed

1. **Dockerfile**: Fixed the stage reference from `--from=build` to `--from=builder`
2. **nginx.conf**: Updated to proxy to your backend IP (68.183.237.216:8080)
3. **Environment**: Created .env.production with correct backend URL
4. **Deployment Guide**: Updated with your domain (stasis-edu.tech)

## After Deployment Success

1. **Check if container is running:**
```bash
docker ps | grep stasis-frontend-container
```

2. **Test the health endpoint:**
```bash
curl http://localhost/health
```

3. **Configure Nginx for your domain (optional for now):**
```bash
# Install Nginx
sudo apt install nginx -y

# Create site config
sudo nano /etc/nginx/sites-available/stasis
```

Add this configuration:
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

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/stasis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Your app should now be accessible at your droplet IP or domain!
