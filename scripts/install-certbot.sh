#!/bin/bash

# CTS v3.1 - Let's Encrypt SSL Certificate Setup
# Installs certbot and obtains SSL certificates

set -e

echo "=================================="
echo "Let's Encrypt SSL Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: sudo bash install-certbot.sh yourdomain.com"
    echo "Example: sudo bash install-certbot.sh cts.example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Install certbot
echo "[1/3] Installing certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Stop nginx temporarily
echo "[2/3] Stopping nginx..."
systemctl stop nginx

# Obtain certificate
echo "[3/3] Obtaining SSL certificate..."
certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email

# Update nginx configuration with real domain
echo ""
echo "Updating nginx configuration..."
sed -i "s/server_name _;/server_name $DOMAIN;/g" /etc/nginx/nginx.conf

# Update SSL certificate paths
sed -i "s|/etc/nginx/ssl/fullchain.pem|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/nginx.conf
sed -i "s|/etc/nginx/ssl/privkey.pem|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/nginx.conf

# Start nginx
echo "Starting nginx..."
systemctl start nginx

# Setup auto-renewal
echo ""
echo "Setting up automatic certificate renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=================================="
echo "✅ SSL Certificate Installed!"
echo "=================================="
echo ""
echo "Certificate Details:"
certbot certificates
echo ""
echo "Your site is now available at: https://$DOMAIN"
echo ""
echo "Auto-renewal is configured. Test renewal with:"
echo "  sudo certbot renew --dry-run"
echo ""
