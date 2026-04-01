# Quick Start Guide - CTS v3.1

Get CTS v3.1 running in under 5 minutes.

## One-Command Install

\`\`\`bash
npx create-cts-app my-trading-bot
cd my-trading-bot
npm run dev
\`\`\`

## Step-by-Step

### 1. Clone & Install (2 minutes)

\`\`\`bash
git clone https://github.com/your-repo/cts-v3.1.git
cd cts-v3.1
npm install
\`\`\`

### 2. Setup (2 minutes)

\`\`\`bash
npm run setup
\`\`\`

**The setup wizard will ask:**
- Project name? (default: CTS-v3)
- Port? (default: 3000)
- Database? (SQLite or PostgreSQL)

It automatically:
- ✓ Generates secure secrets
- ✓ Creates .env.local
- ✓ Sets up database
- ✓ Runs migrations
- ✓ Creates directories

### 3. Start (1 minute)

\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`

Open http://localhost:3000

## First Steps in UI

1. **Settings → Exchange Connections**
   - Add your exchange API keys
   - Test connection

2. **Settings → Indications**
   - Configure Main indicators (Direction, Move, Active)
   - Configure Common indicators (RSI, MACD, etc.)

3. **Presets**
   - Create your first preset
   - Configure trade settings

4. **Live Trading**
   - Start TradeEngine
   - Monitor positions

## Common Commands

\`\`\`bash
npm run dev              # Development server
npm run build            # Production build  
npm start                # Production server
npm run db:status        # Check database
npm run system:check     # Health check
\`\`\`

## Need Help?

- Full docs: [README.md](README.md)
- Installation: [INSTALL.md](INSTALL.md)
- Troubleshooting: [BUILD_TROUBLESHOOTING.md](BUILD_TROUBLESHOOTING.md)
- NPX guide: [NPX_DEPLOYMENT_GUIDE.md](NPX_DEPLOYMENT_GUIDE.md)
