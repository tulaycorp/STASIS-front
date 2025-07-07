#!/bin/sh

# Health check script for STASIS frontend container
# This script checks if nginx is running and serving content properly

# Check if nginx process is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx process not found"
    exit 1
fi

# Check if port 80 is listening
if ! netstat -ln | grep -q ":80 "; then
    echo "ERROR: nginx not listening on port 80"
    exit 1
fi

# Check if health endpoint responds
if command -v curl > /dev/null; then
    if curl -f -s http://localhost/health > /dev/null; then
        echo "OK: Health check passed"
        exit 0
    else
        echo "ERROR: Health endpoint not responding"
        exit 1
    fi
else
    # Fallback if curl is not available
    if wget -q -O /dev/null http://localhost/health; then
        echo "OK: Health check passed"
        exit 0
    else
        echo "ERROR: Health endpoint not responding"
        exit 1
    fi
fi
