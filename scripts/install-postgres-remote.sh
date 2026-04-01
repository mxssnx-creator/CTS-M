#!/bin/bash

# Remote PostgreSQL Installation Script for CTS v3
# This script installs and configures PostgreSQL on a remote Ubuntu/Debian server

set -e

echo "========================================="
echo "CTS v3 - Remote PostgreSQL Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root or with sudo"
  exit 1
fi

DB_NAME="${DB_NAME:-cts-v3}"
DB_USER="${DB_USER:-cts}"
DB_PASSWORD="${DB_PASSWORD:-00998877}"
DB_PORT="${DB_PORT:-5432}"

echo "Installing PostgreSQL..."
apt-get update
apt-get install -y postgresql postgresql-contrib

echo "Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

echo "Creating database and user..."
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE "${DB_NAME}";

-- Create user
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "${DB_NAME}" TO ${DB_USER};

-- Connect to database and grant schema privileges
\c "${DB_NAME}"
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Show version
SELECT version();
EOF

echo "Configuring PostgreSQL for remote connections..."
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Allow remote connections
if ! grep -q "listen_addresses = '\*'" "$PG_CONF"; then
  echo "listen_addresses = '*'" >> "$PG_CONF"
fi

# Allow password authentication from all IPs (adjust as needed for security)
if ! grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA"; then
  echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA"
fi

echo "Restarting PostgreSQL..."
systemctl restart postgresql

echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
  ufw allow ${DB_PORT}/tcp
  echo "Firewall rule added for port ${DB_PORT}"
fi

echo ""
echo "========================================="
echo "PostgreSQL Installation Complete!"
echo "========================================="
echo ""
echo "Database Name: ${DB_NAME}"
echo "Database User: ${DB_USER}"
echo "Database Password: ${DB_PASSWORD}"
echo "Database Port: ${DB_PORT}"
echo ""
echo "Connection String:"
echo "postgresql://${DB_USER}:${DB_PASSWORD}@YOUR_SERVER_IP:${DB_PORT}/${DB_NAME}"
echo ""
echo "For this deployment, use:"
echo "postgresql://cts:00998877@83.229.86.105:5432/cts-v3"
echo ""
echo "IMPORTANT: Save these credentials securely!"
echo "Add this to your .env file or Vercel environment variables:"
echo "REMOTE_POSTGRES_URL=postgresql://${DB_USER}:${DB_PASSWORD}@YOUR_SERVER_IP:${DB_PORT}/${DB_NAME}"
echo ""
echo "Security Recommendations:"
echo "1. Change the database password regularly"
echo "2. Restrict pg_hba.conf to specific IP addresses"
echo "3. Enable SSL/TLS for encrypted connections"
echo "4. Set up regular backups"
echo ""
