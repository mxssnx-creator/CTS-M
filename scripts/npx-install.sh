#!/bin/bash

# CTS v3.1 NPX Installation Script
# Usage: npx github:your-username/cts-v3.1 install

set -e

echo "🚀 CTS v3.1 NPX Installation"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18.0.0 or higher required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo ""

# Check npm version
echo -e "${YELLOW}Checking npm version...${NC}"
npm --version > /dev/null 2>&1 || { echo -e "${RED}Error: npm not found${NC}"; exit 1; }
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Get installation directory
INSTALL_DIR="${1:-.}"
if [ "$INSTALL_DIR" != "." ]; then
    echo -e "${YELLOW}Creating installation directory...${NC}"
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}Installation directory: $(pwd)${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps

echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Run setup wizard
echo -e "${YELLOW}Starting setup wizard...${NC}"
echo ""
npm run setup

echo ""
echo -e "${GREEN}=============================="
echo "✓ CTS v3.1 Installation Complete!"
echo "==============================${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $INSTALL_DIR"
echo "  2. Review .env.local configuration"
echo "  3. npm run dev (development)"
echo "  4. npm run build && npm start (production)"
echo ""
echo "For help: npm run system:check"
echo ""
