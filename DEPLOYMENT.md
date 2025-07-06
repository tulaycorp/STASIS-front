# STASIS Frontend Production Deployment Guide

## Digital Ocean Deployment Instructions

### Prerequisites
- Digital Ocean Droplet (Ubuntu 20.04+ recommended)
- Docker installed on the droplet
- Domain name pointed to your droplet IP
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Setup

1. **Create Digital Ocean Droplet**
   ```bash
   # Choose Ubuntu 20.04 or later
   # Minimum: 1GB RAM, 1 vCPU
   # Recommended: 2GB RAM, 2 vCPU for better performance
   ```

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

3. **Install Nginx (for SSL termination)**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

### Step 2: Upload Frontend Code

1. **Clone your repository**
   ```bash
   git clone https://github.com/your-username/stasis.git
   cd stasis/frontend
   ```

2. **Configure environment variables**
   ```bash
   # Edit .env.production
   nano .env.production
   
   # Update with your backend URL:
   REACT_APP_API_BASE_URL=https://your-backend-domain.com
   ```

3. **Update nginx.conf**
   ```bash
   # Edit nginx.conf and update the backend proxy URL
   nano nginx.conf
   
   # Change this line:
   proxy_pass http://your-backend-url:8080;
   # To your actual backend URL:
   proxy_pass https://your-backend-domain.com;
   ```

### Step 3: Deploy the Application

1. **Make deploy script executable**
   ```bash
   chmod +x deploy.sh
   ```

2. **Run deployment**
   ```bash
   ./deploy.sh
   ```

3. **Verify deployment**
   ```bash
   docker ps
   curl http://localhost/health
   ```

### Step 4: Configure SSL with Nginx

1. **Create Nginx site configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/stasis
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
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

2. **Enable the site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/stasis /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

### Step 5: Set up Auto-renewal and Monitoring

1. **Auto-renewal for SSL**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

2. **Container health monitoring**
   ```bash
   # Create monitoring script
   nano ~/monitor.sh
   ```

   Add this content:
   ```bash
   #!/bin/bash
   if ! docker ps | grep -q stasis-frontend-container; then
       echo "Container is down, restarting..."
       cd /path/to/stasis/frontend
       ./deploy.sh
   fi
   ```

   ```bash
   chmod +x ~/monitor.sh
   # Add to crontab to run every 5 minutes
   crontab -e
   # Add: */5 * * * * /home/your-user/monitor.sh
   ```

### Step 6: Performance Optimization

1. **Enable Nginx caching**
   ```bash
   sudo nano /etc/nginx/nginx.conf
   ```

   Add in http block:
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g 
                    inactive=60m use_temp_path=off;
   ```

2. **Configure firewall**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

### Troubleshooting

1. **Check container logs**
   ```bash
   docker logs stasis-frontend-container
   ```

2. **Check Nginx logs**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Restart services**
   ```bash
   # Restart container
   docker restart stasis-frontend-container
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

### Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Redeploy**
   ```bash
   ./deploy.sh
   ```

### Environment Variables Reference

- `REACT_APP_API_BASE_URL`: Your backend API URL
- `REACT_APP_ENVIRONMENT`: Set to "production"
- `GENERATE_SOURCEMAP`: Set to "false" for security

### Security Checklist

- ✅ SSL certificate installed
- ✅ Firewall configured
- ✅ Source maps disabled in production
- ✅ Security headers configured in Nginx
- ✅ Regular updates scheduled
- ✅ Monitoring in place

### Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker and Nginx logs
3. Verify environment configuration
4. Test API connectivity from the server
