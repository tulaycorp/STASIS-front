# STASIS Frontend Simple Deployment Guide

## Basic Docker Deployment Instructions

### Prerequisites
- Server with Docker installed (any cloud provider or local machine)
- Basic terminal access

### Step 1: Server Setup

1. **Install Docker**
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   
   # For other systems, follow Docker's official installation guide
   ```

### Step 2: Deploy the Application

1. **Clone your repository**
   ```bash
   git clone https://github.com/your-username/stasis.git
   cd stasis/frontend
   ```

2. **Make deploy script executable**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment**
   ```bash
   ./deploy.sh
   ```

4. **Verify deployment**
   ```bash
   docker ps
   curl http://localhost/health
   ```

### Step 3: Access Your Application

- Your application will be available at: `http://your-server-ip`
- Health check endpoint: `http://your-server-ip/health`

### Troubleshooting

1. **Check container logs**
   ```bash
   docker logs stasis-frontend-container
   ```

2. **Check if container is running**
   ```bash
   docker ps | grep stasis-frontend
   ```

3. **Restart container**
   ```bash
   docker restart stasis-frontend-container
   ```

4. **Rebuild and redeploy**
   ```bash
   ./deploy.sh
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

### Port Configuration

- The application runs on port 80 by default
- To change the port, edit the `PORT` variable in `deploy.sh`
- Make sure your firewall allows traffic on the chosen port

### Basic Monitoring

Create a simple monitoring script:
```bash
nano ~/monitor.sh
```

Add this content:
```bash
#!/bin/bash
if ! docker ps | grep -q stasis-frontend-container; then
    echo "Container is down, restarting..."
    cd /path/to/your/stasis/frontend
    ./deploy.sh
fi
```

Make it executable and add to crontab:
```bash
chmod +x ~/monitor.sh
crontab -e
# Add: */5 * * * * /home/your-user/monitor.sh
```

### Support

For issues:
1. Check the troubleshooting section above
2. Review Docker container logs
3. Ensure Docker is running properly
4. Verify port accessibility
