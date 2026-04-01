#!/bin/bash

# CTS v3 Complete Download and Install Script
# One-command installation from GitHub with auto-update

set -e

SCRIPT_VERSION="2.0.0"
SCRIPT_URL="https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh"

REPO_URL="${REPO_URL:-https://github.com/mxssnx-creator/v0-cts-v3-zw}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="$HOME/cts-v3"
PORT=3000
PROJECT_NAME="cts-v3"
DATABASE_TYPE="sqlite"
SKIP_UPDATE_CHECK=false

check_for_updates() {
    if [ "$SKIP_UPDATE_CHECK" = true ]; then
        return 0
    fi
    
    echo "Checking for script updates..."
    
    TEMP_SCRIPT="/tmp/download-and-install-latest.sh"
    if command -v curl &> /dev/null; then
        curl -fsSL "$SCRIPT_URL" -o "$TEMP_SCRIPT" 2>/dev/null || {
            echo "Warning: Could not check for updates"
            return 0
        }
    elif command -v wget &> /dev/null; then
        wget -q "$SCRIPT_URL" -O "$TEMP_SCRIPT" 2>/dev/null || {
            echo "Warning: Could not check for updates"
            return 0
        }
    else
        return 0
    fi
    
    LATEST_VERSION=$(grep "^SCRIPT_VERSION=" "$TEMP_SCRIPT" | cut -d'"' -f2)
    
    if [ -z "$LATEST_VERSION" ]; then
        rm -f "$TEMP_SCRIPT"
        return 0
    fi
    
    if [ "$LATEST_VERSION" != "$SCRIPT_VERSION" ]; then
        echo ""
        echo "=========================================="
        echo "Update Available!"
        echo "Current version: $SCRIPT_VERSION"
        echo "Latest version:  $LATEST_VERSION"
        echo "=========================================="
        echo ""
        read -p "Download and use latest version? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo "Updating script..."
            chmod +x "$TEMP_SCRIPT"
            exec "$TEMP_SCRIPT" "$@" --skip-update-check
        fi
    else
        echo "✓ Script is up to date (v$SCRIPT_VERSION)"
    fi
    
    rm -f "$TEMP_SCRIPT"
}

ORIGINAL_ARGS=("$@")
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p) PORT="$2"; shift 2 ;;
        --project-name|--name|-n) PROJECT_NAME="$2"; shift 2 ;;
        --database-type|--db-type|--database|-d) DATABASE_TYPE="$2"; shift 2 ;;
        --sqlite) DATABASE_TYPE="sqlite"; shift ;;
        --postgresql) DATABASE_TYPE="postgresql"; shift ;;
        --remote-postgresql) DATABASE_TYPE="remote-postgresql"; shift ;;
        --repo) REPO_URL="$2"; shift 2 ;;
        --branch) BRANCH="$2"; shift 2 ;;
        --dir) INSTALL_DIR="$2"; shift 2 ;;
        --skip-update-check) SKIP_UPDATE_CHECK=true; shift ;;
        --help|-h)
            echo "CTS v3 Download and Install Script v$SCRIPT_VERSION"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --port, -p PORT              Set application port (default: 3000)"
            echo "  --name, -n NAME              Set project name (default: cts-v3)"
            echo "  --db-type, -d TYPE           Database type: sqlite|postgresql|remote-postgresql (default: sqlite)"
            echo "  --database TYPE              (alias for --db-type)"
            echo "  --sqlite                     Use SQLite database"
            echo "  --postgresql                 Use local PostgreSQL database"
            echo "  --remote-postgresql          Use remote PostgreSQL database"
            echo "  --repo URL                   Repository URL"
            echo "  --branch BRANCH              Git branch (default: main)"
            echo "  --dir PATH                   Installation directory (default: ~/cts-v3)"
            echo "  --skip-update-check          Skip checking for script updates"
            echo "  --help, -h                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --port 3001 --db-type sqlite"
            echo "  $0 --name my-cts --db-type remote-postgresql"
            echo "  curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 8080 --db-type sqlite"
            exit 0
            ;;
        *) shift ;;
    esac
done

check_for_updates "${ORIGINAL_ARGS[@]}"

echo "=========================================="
echo "CTS v3 Complete Installer v$SCRIPT_VERSION"
echo "=========================================="
echo "Repository: $REPO_URL"
echo "Branch: $BRANCH"
echo "Install Directory: $INSTALL_DIR"
echo "Database Type: $DATABASE_TYPE"
echo "Port: $PORT"
echo "Project Name: $PROJECT_NAME"
echo ""

# Check prerequisites
echo "[1/4] Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq && sudo apt-get install -y git
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    else
        echo "Error: git is required. Please install it manually."
        exit 1
    fi
fi
echo "✓ Git found"

# Download repository
echo "[2/4] Downloading repository..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Directory exists, updating..."
    cd "$INSTALL_DIR"
    git pull origin "$BRANCH" 2>/dev/null || echo "Warning: Could not update"
else
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
        echo "Error: Failed to clone repository"
        exit 1
    }
    cd "$INSTALL_DIR"
fi
echo "✓ Repository downloaded"

# Make scripts executable
echo "[3/4] Preparing installation..."
chmod +x scripts/*.sh 2>/dev/null || true
echo "✓ Scripts prepared"

# Run installation
echo "[4/4] Running installation..."
echo ""

INSTALL_ARGS="--port $PORT --name $PROJECT_NAME --db-type $DATABASE_TYPE"

if [ -f "scripts/install-continuous.sh" ]; then
    ./scripts/install-continuous.sh $INSTALL_ARGS
else
    echo "Error: Installation script not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Download and Installation Complete!"
echo "=========================================="
echo ""
echo "Installation directory: $INSTALL_DIR"
echo "Database type: $DATABASE_TYPE"
echo "Port: $PORT"
echo ""
echo "To manage your installation:"
echo "  cd $INSTALL_DIR"
echo "  ./start-cts.sh       # Start services"
echo "  ./stop-cts.sh        # Stop services"
echo "  ./status-cts.sh      # Check status"
echo ""
