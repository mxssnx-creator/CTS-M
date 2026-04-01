#!/bin/bash

# CTS v3.1 - Nginx Setup Script for Ubuntu
# Installs and configures nginx for the CTS application

set -e

echo "=================================="
echo "CTS v3.1 - Nginx Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Update package list
echo "[1/6] Updating package list..."
apt-get update

# Install nginx
echo "[2/6] Installing nginx..."
apt-get install -y nginx

# Stop nginx to configure
echo "[3/6] Stopping nginx for configuration..."
systemctl stop nginx

# Backup existing configuration
echo "[4/6] Backing up existing configuration..."
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "[5/6] Installing CTS nginx configuration..."
if [ -f nginx.conf ]; then
    cp nginx.conf /etc/nginx/nginx.conf
    echo "✅ Configuration copied"
else
    echo "⚠️  nginx.conf not found in current directory"
    echo "   Using default nginx configuration"
fi

# Create SSL directory (for Let's Encrypt certificates)
mkdir -p /etc/nginx/ssl
mkdir -p /var/www/certbot
chmod 755 /var/www/certbot

# Create self-signed certificate for initial setup (replace with Let's Encrypt later)
echo "[6/6] Creating self-signed SSL certificate..."
if [ ! -f /etc/nginx/ssl/privkey.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "⚠️  Self-signed certificate created. Replace with Let's Encrypt in production!"
fi

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if nginx -t; then
    echo "✅ Configuration valid"
else
    echo "❌ Configuration error detected"
    exit 1
fi

# Enable and start nginx
echo ""
echo "Starting nginx service..."
systemctl enable nginx
systemctl start nginx

# Check status
sleep 2
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    systemctl status nginx
    exit 1
fi

echo ""
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow 'OpenSSH'
    echo "✅ Firewall rules added"
else
    echo "⚠️  UFW not installed, skipping firewall configuration"
fi

# Display status
echo ""
echo "=================================="
echo "✅ Nginx Setup Complete!"
echo "=================================="
echo ""
echo "Service Status:"
systemctl status nginx --no-pager | head -n 10
echo ""
echo "Next Steps:"
echo "1. Update DNS to point to this server"
echo "2. Install Let's Encrypt certificate:"
echo "   sudo apt-get install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo "3. Start your Next.js app on port 3000:"
echo "   cd /path/to/cts && npm start"
echo "4. Access your application via https://yourdomain.com"
echo ""
echo "Useful Commands:"
echo "  sudo systemctl status nginx    - Check status"
echo "  sudo systemctl restart nginx   - Restart service"
echo "  sudo systemctl reload nginx    - Reload config"
echo "  sudo nginx -t                  - Test configuration"
echo "  sudo tail -f /var/log/nginx/error.log  - View errors"
echo "  sudo tail -f /var/log/nginx/access.log - View access"
echo ""
