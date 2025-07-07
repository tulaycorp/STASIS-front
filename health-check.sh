#!/bin/bash

# STASIS Frontend Health Check Script
# This script checks the health of the deployed application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="stasis-edu.tech"

echo "🏥 STASIS Frontend Health Check"
echo "==============================="

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check Docker containers
print_status "Checking Docker containers..."
if docker-compose ps | grep -q "Up"; then
    print_success "Docker containers are running"
else
    print_error "Docker containers are not running"
    exit 1
fi

# Check HTTP response
print_status "Checking HTTP response..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ || echo "000")
if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "200" ]; then
    print_success "HTTP response: $HTTP_STATUS"
else
    print_error "HTTP response: $HTTP_STATUS"
fi

# Check HTTPS response
print_status "Checking HTTPS response..."
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    print_success "HTTPS response: $HTTPS_STATUS"
else
    print_error "HTTPS response: $HTTPS_STATUS"
fi

# Check SSL certificate
print_status "Checking SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
if [ -n "$SSL_EXPIRY" ]; then
    print_success "SSL certificate expires: $SSL_EXPIRY"
else
    print_error "SSL certificate check failed"
fi

# Check health endpoint
print_status "Checking health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    print_success "Health endpoint: $HEALTH_STATUS"
else
    print_error "Health endpoint: $HEALTH_STATUS"
fi

# Check API proxy
print_status "Checking API proxy..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/courses || echo "000")
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    print_success "API proxy: $API_STATUS (backend reachable)"
else
    print_warning "API proxy: $API_STATUS (check backend connectivity)"
fi

# Check disk space
print_status "Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_success "Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    print_warning "Disk usage: ${DISK_USAGE}% (consider cleanup)"
else
    print_error "Disk usage: ${DISK_USAGE}% (critical)"
fi

# Check memory usage
print_status "Checking memory usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    print_success "Memory usage: ${MEMORY_USAGE}%"
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    print_warning "Memory usage: ${MEMORY_USAGE}% (monitor closely)"
else
    print_error "Memory usage: ${MEMORY_USAGE}% (critical)"
fi

# Check container logs for errors
print_status "Checking recent container logs for errors..."
ERROR_COUNT=$(docker-compose logs --tail=100 2>/dev/null | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No recent errors in logs"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    print_warning "$ERROR_COUNT recent errors found in logs"
else
    print_error "$ERROR_COUNT recent errors found in logs"
fi

echo ""
echo "📊 System Information:"
echo "====================="
echo "• Domain: $DOMAIN"
echo "• Containers: $(docker-compose ps --services | wc -l) services"
echo "• Uptime: $(uptime -p)"
echo "• Load: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "🔗 Quick Links:"
echo "==============="
echo "• Main site: https://$DOMAIN"
echo "• Health check: https://$DOMAIN/health"
echo "• API endpoint: https://$DOMAIN/api"

echo ""
print_success "Health check completed!"
