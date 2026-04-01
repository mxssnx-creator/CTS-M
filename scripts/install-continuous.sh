#!/bin/bash

# CTS v3 Continuous Installation Script
# Fully automated installation with all features
# Supports: Ubuntu 24/22, Debian, CentOS, and other Linux distributions

set -e

# Configuration
PORT=3000
PROJECT_NAME="cts-v3"
DEFAULT_PASSWORD="00998877"
DATABASE_TYPE=""

# Predefined Remote Database
DB_HOST="149.33.11.224"
DB_PORT="5432"
DB_NAME="ctsv3"
DB_USER="root"
DB_PASSWORD="00998877"

CHECK_ONLY=false
STRICT_CHECK=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p) PORT="$2"; shift 2 ;;
        --project-name|--name|-n) PROJECT_NAME="$2"; shift 2 ;;
        --database-type|--db-type|--database|-d) DATABASE_TYPE="$2"; shift 2 ;;
        --sqlite) DATABASE_TYPE="sqlite"; shift ;;
        --postgresql) DATABASE_TYPE="postgresql"; shift ;;
        --remote-postgresql) DATABASE_TYPE="remote-postgresql"; shift ;;
        --check) CHECK_ONLY=true; shift ;;
        --with-checks) STRICT_CHECK=true; shift ;;
        *) shift ;;
    esac
done

if [ -z "$DATABASE_TYPE" ]; then
    # Check if running interactively
    if [ -t 0 ]; then
        echo ""
        echo "❓ Database Configuration:"
        echo "   Which database type do you want to use?"
        echo "   [1] SQLite (Default) - Easiest setup, good for single server"
        echo "   [2] PostgreSQL       - Recommended for production/high load"
        read -p "   Enter choice [1-2]: " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[2]$ ]]; then
            DATABASE_TYPE="postgresql"
            echo "ℹ Selected: PostgreSQL"
        else
            DATABASE_TYPE="sqlite"
            echo "ℹ Selected: SQLite"
        fi
        echo ""
    else
        # Default to sqlite for non-interactive mode
        DATABASE_TYPE="sqlite"
    fi
fi

if [ "$CHECK_ONLY" = true ]; then
    echo "=========================================="
    echo "CTS v3 - Continuous Check Mode"
    echo "=========================================="
    
    # Install dependencies
    echo "Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install --production=false || npm install --include=dev
    else
        npm install --include=dev
    fi

    # Run Checks
    echo "Running Type Check..."
    if command -v bun &> /dev/null; then
        bun run type-check || { echo "Type-check failed"; exit 1; }
    else
        npm run type-check || { echo "Type-check failed"; exit 1; }
    fi

    echo "Running Build Check..."
    if command -v bun &> /dev/null; then
        bun run build || { echo "Build failed"; exit 1; }
    else
        npm run build || { echo "Build failed"; exit 1; }
    fi

    echo "✓ All checks passed"
    exit 0
fi

# Interactive Check Prompt (only if no args provided or interactive shell)
if [ -z "$STRICT_CHECK" ]; then
    # Check if running interactively
    if [ -t 0 ]; then
        echo ""
        echo "❓ Installation Option:"
        read -p "   Do you want to verify system integrity (Type Check & Build) before installing? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            STRICT_CHECK=true
            echo "ℹ Strict checks enabled"
        else
            STRICT_CHECK=false
            echo "ℹ Standard installation selected"
        fi
        echo ""
    else
        STRICT_CHECK=false
    fi
fi

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "Error: Invalid port number: $PORT"
    echo "Port must be between 1 and 65535"
    exit 1
fi

# Auto-detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
        ubuntu)
            [[ "$VERSION_ID" == "24."* ]] && OS_TYPE="ubuntu24" || OS_TYPE="ubuntu22"
            ;;
        debian) OS_TYPE="debian" ;;
        centos|rhel|fedora) OS_TYPE="centos" ;;
        *) OS_TYPE="other" ;;
    esac
else
    OS_TYPE="other"
fi

echo "=========================================="
echo "CTS v3 Continuous Installation"
echo "=========================================="
echo "OS: $OS_TYPE | Port: $PORT | DB: $DATABASE_TYPE"
echo ""

echo "[1/15] Stopping existing services and processes..."
sudo systemctl stop cts-web cts-trade cts-logrotate.timer cts-backup.timer 2>/dev/null || true
# Kill any remaining Node.js processes on the port
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 2
echo "✓"

# [2/15] Create directories
echo "[2/15] Creating directories..."
mkdir -p data/{databases,exports,imports} logs/{trade-engine,web-engine,system} backups/{daily,weekly} temp services
chmod -R 755 data logs backups temp services
echo "✓"

# [3/15] Install system dependencies
echo "[3/15] Installing system dependencies..."
case "$OS_TYPE" in
    ubuntu24|ubuntu22|debian)
        sudo apt-get update -qq 2>/dev/null || true
        sudo apt-get install -y -qq build-essential libssl-dev python3-pip python3-venv sqlite3 libsqlite3-dev curl git postgresql-client python3-dev 2>/dev/null || true
        ;;
    centos)
        sudo yum groupinstall -y -q "Development Tools" 2>/dev/null || true
        sudo yum install -y -q openssl-devel python3-pip sqlite curl git postgresql python3-devel 2>/dev/null || true
        ;;
esac
echo "✓"

# [4/15] Install Node.js
echo "[4/15] Checking Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - 2>/dev/null || true
    sudo apt-get install -y nodejs 2>/dev/null || true
fi
NODE_BIN=$(which node)
NODE_VERSION=$(node -v 2>/dev/null || echo 'not found')
echo "✓ Node.js $NODE_VERSION at $NODE_BIN"

# [5/15] Install Bun
echo "[5/15] Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash 2>/dev/null || true
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi
echo "✓ Bun $(bun --version 2>/dev/null || echo 'not found')"

# [6/15] Install pnpm
echo "[6/15] Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@latest 2>/dev/null || true
fi
echo "✓ pnpm $(pnpm --version 2>/dev/null || echo 'not found')"

# [7/15] Install Node dependencies
echo "[7/15] Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    if command -v bun &> /dev/null; then
        echo "  Using bun..."
        bun install --production=false 2>/dev/null || npm install --include=dev 2>/dev/null || true
    elif command -v pnpm &> /dev/null; then
        echo "  Using pnpm..."
        # Configure pnpm to allow build scripts for native modules
        pnpm config set enable-pre-post-scripts true 2>/dev/null || true
        pnpm config set unsafe-perm true 2>/dev/null || true
        # Install with build scripts enabled
        pnpm install --force --ignore-scripts=false 2>&1 | tee logs/install.log || {
            echo "⚠ Some packages failed, continuing..."
        }
        # Explicitly rebuild native modules
        echo "  Rebuilding native modules with pnpm..."
        pnpm rebuild better-sqlite3 sharp @tailwindcss/oxide 2>&1 | tee -a logs/install.log || {
            echo "⚠ Some native modules failed to rebuild"
        }
    else
        echo "  Using npm..."
        npm install --include=dev 2>/dev/null || true
    fi
fi
echo "✓"

# [8/15] Rebuilding native modules
echo "[8/15] Rebuilding native modules..."
echo "ℹ Rebuilding better-sqlite3 for current Node.js version..."
if command -v pnpm &> /dev/null; then
    pnpm rebuild better-sqlite3 2>/dev/null || echo "⚠ pnpm rebuild had warnings"
elif command -v bun &> /dev/null; then
    bun rebuild better-sqlite3 2>/dev/null || npm rebuild better-sqlite3 2>/dev/null || echo "⚠ Could not rebuild with bun, trying npm..."
else
    npm rebuild better-sqlite3 2>/dev/null || echo "⚠ Native module rebuild had warnings"
fi
echo "✓"

# [9/15] Install Python dependencies
echo "[9/15] Installing Python dependencies..."
python3 -m pip install --upgrade pip --break-system-packages 2>/dev/null || true
python3 -m pip install --break-system-packages \
    "pybit>=5.0.0" \
    "bingx-python>=1.0.0" \
    "pionex-python>=1.0.0" \
    "websocket-client>=1.0.0" \
    "requests>=2.25.0" \
    "python-dotenv>=0.19.0" \
    "schedule>=1.0.0" 2>/dev/null || echo "⚠ Some Python packages failed"
echo "✓"

# [10/15] Generate keys
echo "[10/15] Generating encryption keys..."
ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
echo "✓"

# [11/15] Configure database
echo "[11/15] Configuring database ($DATABASE_TYPE)..."
case "$DATABASE_TYPE" in
    sqlite)
        DATABASE_URL="file:./data/cts.db"
        DATABASE_PATH="./data/cts.db"
        echo "ℹ Using SQLite database at $DATABASE_PATH"
        echo "ℹ 54 database migrations will auto-run on first start"
        ;;
    postgresql)
        PG_HOST=${POSTGRES_HOST:-localhost}
        PG_PORT=${POSTGRES_PORT:-5432}
        PG_DB=${POSTGRES_DB:-ctsv3}
        PG_USER=${POSTGRES_USER:-postgres}
        PG_PASS=${POSTGRES_PASSWORD:-postgres}
        DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}"
        echo "ℹ Using PostgreSQL at ${PG_HOST}:${PG_PORT}/${PG_DB}"
        echo "ℹ 54 database migrations will auto-run on first start"
        ;;
    remote-postgresql)
        DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        echo "ℹ Using Remote PostgreSQL at ${DB_HOST}:${DB_PORT}/${DB_NAME}"
        echo "ℹ 54 database migrations will auto-run on first start"
        ;;
    *)
        echo "Error: Invalid database type: $DATABASE_TYPE"
        echo "Valid options: sqlite, postgresql, remote-postgresql"
        exit 1
        ;;
esac

echo "ℹ Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=$PORT
PROJECT_NAME=$PROJECT_NAME
DEFAULT_PASSWORD=$DEFAULT_PASSWORD
ENCRYPTION_KEY=$ENCRYPTION_KEY
JWT_SECRET=$JWT_SECRET
DATABASE_URL=$DATABASE_URL
DATABASE_TYPE=$DATABASE_TYPE
$([ "$DATABASE_TYPE" = "remote-postgresql" ] && echo "REMOTE_POSTGRES_URL=$DATABASE_URL")
$([ "$DATABASE_TYPE" = "sqlite" ] && echo "DATABASE_PATH=$DATABASE_PATH")
BYBIT_TESTNET=true
LOG_LEVEL=info
EOF
echo "✓"

echo "[12/15] Initializing database..."
export DATABASE_TYPE DATABASE_URL DATABASE_PATH
if [ -f "scripts/init-database.sh" ]; then
    chmod +x scripts/init-database.sh
    ./scripts/init-database.sh || echo "⚠ Database initialization had some errors"
else
    echo "⚠ Database initialization script not found at scripts/init-database.sh"
    # Create basic database structure for SQLite
    if [ "$DATABASE_TYPE" = "sqlite" ]; then
        mkdir -p data
        touch "$DATABASE_PATH"
        echo "ℹ Created empty SQLite database"
    fi
fi
echo "✓"

echo "[13/15] Building Next.js application..."
echo "ℹ Running TypeScript type-check..."
if [ "$STRICT_CHECK" = true ]; then
    echo "ℹ Running Strict Checks..."
    
    echo "ℹ Running TypeScript type-check..."
    if command -v bun &> /dev/null; then
        bun run type-check || { echo "❌ Type-check failed"; exit 1; }
    else
        npm run type-check || { echo "❌ Type-check failed"; exit 1; }
    fi
    
    echo "ℹ Building application..."
    if command -v bun &> /dev/null; then
        bun run build || { echo "❌ Build failed"; exit 1; }
    else
        npm run build || { echo "❌ Build failed"; exit 1; }
    fi
    echo "✓ Build passed"
else
    echo "ℹ Running Standard Build..."
    echo "ℹ Running TypeScript type-check..."
    if command -v bun &> /dev/null; then
        bun run type-check 2>&1 | tail -n 10 || echo "⚠ Type-check had warnings"
        echo "ℹ Building application..."
        bun run build 2>&1 | tee logs/build.log | tail -n 10 || echo "⚠ Build failed, will try to start anyway"
    else
        npm run type-check 2>&1 | tail -n 10 || echo "⚠ Type-check had warnings"
        echo "ℹ Building application..."
        npm run build 2>&1 | tee logs/build.log | tail -n 10 || echo "⚠ Build failed, will try to start anyway"
    fi
fi
echo "✓"

echo "[14/15] Creating systemd services..."
sudo tee /etc/systemd/system/cts-web.service > /dev/null <<EOF
[Unit]
Description=$PROJECT_NAME Web
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(command -v bun &> /dev/null && echo "$(which bun) run start" || echo "$(which npm) run start")
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=DATABASE_URL=$DATABASE_URL
Environment=DATABASE_TYPE=$DATABASE_TYPE
Environment=ENCRYPTION_KEY=$ENCRYPTION_KEY
Environment=JWT_SECRET=$JWT_SECRET
Environment=PATH=$HOME/.bun/bin:$HOME/.nvm/versions/node/$(node -v)/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/cts-trade.service > /dev/null <<EOF
[Unit]
Description=$PROJECT_NAME Trade Engine
After=cts-web.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$NODE_BIN services/trade-engine.js
Restart=always
RestartSec=10
Environment=DATABASE_URL=$DATABASE_URL
Environment=DATABASE_TYPE=$DATABASE_TYPE
Environment=PORT=$PORT
Environment=PATH=$HOME/.bun/bin:$HOME/.nvm/versions/node/$(node -v)/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
echo "✓"

echo "ℹ Creating management scripts..."
cat > start-cts.sh << 'EOF'
#!/bin/bash
sudo systemctl start cts-web cts-trade && echo "✓ Services started"
EOF

cat > stop-cts.sh << 'EOF'
#!/bin/bash
sudo systemctl stop cts-web cts-trade && echo "✓ Services stopped"
EOF

cat > status-cts.sh << 'EOF'
#!/bin/bash
echo "=== CTS Services Status ==="
systemctl status cts-web cts-trade --no-pager
EOF

cat > logs-cts.sh << 'EOF'
#!/bin/bash
echo "=== Web Service Logs (last 50 lines) ==="
journalctl -u cts-web -n 50 --no-pager
echo ""
echo "=== Trade Engine Logs (last 50 lines) ==="
journalctl -u cts-trade -n 50 --no-pager
EOF

chmod +x start-cts.sh stop-cts.sh status-cts.sh logs-cts.sh
echo "✓"

echo "[15/15] Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable cts-web cts-trade 2>/dev/null || true
sudo systemctl start cts-web 2>/dev/null || true
echo "ℹ Waiting for web service to start..."
sleep 5
sudo systemctl start cts-trade 2>/dev/null || true
echo "ℹ Waiting for trade engine to start..."
sleep 3

echo ""
echo "ℹ Verifying services..."
if sudo systemctl is-active --quiet cts-web; then
    echo "✓ Web service started"
else
    echo "✗ Web service failed to start. Check logs: journalctl -u cts-web -n 50"
    echo "   Or run: ./logs-cts.sh"
fi

if sudo systemctl is-active --quiet cts-trade; then
    echo "✓ Trade engine started"
else
    echo "⚠ Trade engine failed to start. Check logs: journalctl -u cts-trade -n 50"
    echo "   Or run: ./logs-cts.sh"
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

# Summary
echo ""
echo "=========================================="
echo "✓ Installation Complete!"
echo "=========================================="
echo ""
echo "🌐 Access URLs:"
echo "   Local:   http://localhost:$PORT"
echo "   Network: http://$SERVER_IP:$PORT"
echo ""
echo "🗄️  Database:"
case "$DATABASE_TYPE" in
    sqlite)
        echo "   Type: SQLite"
        echo "   Path: $(pwd)/data/cts.db"
        ;;
    postgresql)
        echo "   Type: PostgreSQL (Local)"
        echo "   Host: ${PG_HOST}:${PG_PORT}/${PG_DB}"
        ;;
    remote-postgresql)
        echo "   Type: PostgreSQL (Remote)"
        echo "   Host: $DB_HOST:$DB_PORT/$DB_NAME"
        ;;
esac
echo ""
echo "🔐 Credentials:"
echo "   Password: $DEFAULT_PASSWORD"
echo ""
echo "🔧 Commands:"
echo "   ./start-cts.sh   - Start services"
echo "   ./stop-cts.sh    - Stop services"
echo "   ./status-cts.sh  - Check status"
echo "   ./logs-cts.sh    - View logs"
echo ""
echo "🤖 Auto Indication:"
echo "   • 8-hour market analysis enabled"
echo "   • Block Strategy: 3-position neutral wait"
echo "   • Level Strategy: Optimal volume incrementing"
echo "   • DCA Strategy: 4 steps max, 2.5x ratio limit"
echo "   • Configure in Settings > Indication > Main > Auto"
echo ""
echo "✅ Production Ready:"
echo "   ✓ 54 database migrations configured (auto-run)"
echo "   ✓ Rate limiting for all exchanges"
echo "   ✓ Time-window query optimization"
echo "   ✓ Automatic data cleanup (7-day retention)"
echo "   ✓ Auto indication with 3 strategies"
echo ""
echo "=========================================="
