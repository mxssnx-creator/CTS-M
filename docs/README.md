# CTS v3.1 - Crypto Trading System

*Professional automated cryptocurrency trading platform with advanced indication system*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

## Overview

CTS v3.1 is a professional-grade crypto trading system featuring:

- **Multi-Exchange Support**: Bybit, BingX, Pionex with unified API
- **Advanced Indication System**: Main (Direction/Move/Active/Optimal) and Common (RSI/MACD/Bollinger/ParabolicSAR/ADX/ATR) indicators
- **Preset Trade Engine**: Automated trading with configurable strategies
- **Strategy Categories**: 
  - **Additional** (Trailing) - Enhancement strategies
  - **Adjust** (Block/DCA) - Volume/position adjustment strategies
- **Real-time WebSocket**: Live market data and position tracking
- **Comprehensive Logging**: System-wide activity monitoring

## Quick Install

### Interactive Setup (Recommended)

The interactive setup script guides you through the complete installation process with prompts for project name, port, and database configuration:

\`\`\`bash
# Clone repository
git clone https://github.com/your-repo/cts-v3.1.git
cd cts-v3.1

# Run interactive setup
npm run setup
\`\`\`

The setup script will:
- Validate Node.js version (18.x - 26.x supported)
- Prompt for project name (default: CTS-v3)
- Prompt for application port (default: 3000)
- Configure database (SQLite or PostgreSQL)
- Generate secure secrets automatically
- Install dependencies
- Create required directories
- Run database migrations
- Optional: Build for production

### One-Line Installation

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash
\`\`\`

### Custom Installation

\`\`\`bash
# Custom port
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 8080

# Custom project name
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --name my-trading-bot

# Multiple instances
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 3000 --name cts-prod
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 3001 --name cts-test
\`\`\`

For detailed instructions, see [INSTALL.md](INSTALL.md).

## Manual Setup

\`\`\`bash
# 1. Clone and install
git clone https://github.com/your-repo/cts-v3.1.git
cd cts-v3.1
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# 3. Run database migrations
npm run db:migrate

# 4. Start development server
npm run dev

# Or start production server
npm run build
npm start
\`\`\`

## System Architecture

### Indication System

**Main Indications** (Step-based progression):
- Direction - Trend analysis (SMA crossovers)
- Move - Momentum detection (ROC)
- Active - Market activity (Volatility/Volume)
- Optimal - Combined scoring

**Common Indicators** (Technical analysis):
- RSI - Relative Strength Index
- MACD - Moving Average Convergence Divergence
- Bollinger Bands - Volatility bands
- Parabolic SAR - Trend following
- ADX - Trend strength
- ATR - Volatility measurement

### Strategy Categories

**Additional (Purple)** - Enhancement strategies:
- Trailing Stop - Dynamic stop-loss based on price movement

**Adjust (Blue)** - Position adjustment strategies:
- Block - Predefined position sizing blocks
- DCA - Dollar Cost Averaging for position building

### Trade Engine Flow

\`\`\`
Market Data → Indication Processing → Strategy Evaluation → Position Management → Exchange Execution
     ↓              ↓                       ↓                      ↓                    ↓
  WebSocket    Main/Common           Additional/Adjust       Pseudo Positions      Live Orders
\`\`\`

## Features

### Dashboard
- Real-time connection status
- Active positions overview
- Performance metrics
- Quick action controls

### Presets Management
- Preset Types with Sets
- Configuration filtering (Main/Common indicators)
- Strategy category organization
- Base settings synchronization

### Settings
- **Exchange**: Connection configuration, position limits
- **Indication**: Main and Common indicator settings
- **Strategy**: Trailing/Block/DCA configuration with categories
- **Install**: Database management, backup/restore, diagnostics

### Live Trading
- Real-time position monitoring
- Manual trade execution
- Risk management controls
- Performance analytics

## Documentation

- [INSTALL.md](INSTALL.md) - Installation guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- [SETTINGS_DOCUMENTATION.md](SETTINGS_DOCUMENTATION.md) - Settings reference
- [VOLUME_CALCULATION_CORRECTIONS.md](VOLUME_CALCULATION_CORRECTIONS.md) - Volume architecture

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL / SQLite
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **State**: SWR for data fetching

## Environment Variables

The setup script automatically generates secure secrets, but you can also configure manually:

\`\`\`bash
# Application
PROJECT_NAME=CTS-v3                          # Project name
PORT=3000                                     # Application port
NEXT_PUBLIC_APP_URL=http://localhost:3000    # Updated with port
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REMOTE_POSTGRES_URL=postgresql://user:password@host:5432/database

# Security (Auto-generated by setup script)
SESSION_SECRET=your-session-secret-32-bytes
JWT_SECRET=your-jwt-secret-32-bytes
ENCRYPTION_KEY=your-encryption-key-32-bytes
API_SIGNING_SECRET=your-api-signing-secret-32-bytes
\`\`\`

## Available Scripts

\`\`\`bash
# Development
npm run dev              # Start dev server (uses PORT env var)
npm run build            # Build for production
npm start                # Start production server (uses PORT env var)

# Setup & Installation
npm run setup            # Interactive setup wizard

# Database Management
npm run db:migrate       # Run database migrations
npm run db:status        # Check database status
npm run db:reset         # Reset database (caution!)
npm run db:backup        # Create database backup

# System Management
npm run system:check     # Comprehensive system health check
npm run system:health    # Quick health check

# Nginx & SSL (Ubuntu/Debian)
npm run nginx:setup      # Install and configure nginx
npm run nginx:restart    # Restart nginx service
npm run nginx:status     # Check nginx status
npm run nginx:logs       # View nginx error logs
npm run certbot:install  # Install SSL certificates

# Utilities
npm run type-check       # TypeScript type checking
npm run lint             # ESLint checking
\`\`\`

## Support

For issues or questions:
1. Check [Troubleshooting](INSTALL.md#troubleshooting)
2. Review system logs via Settings → Install → Diagnostics
3. Open a GitHub issue

## License

MIT License - See LICENSE file for details
