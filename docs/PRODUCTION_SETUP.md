# CTS v3.1 - Production Setup Guide

**Version:** 3.1
**Last Updated:** January 2026

---

## Quick Start

### One-Line Installation (Recommended)

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash
\`\`\`

### Custom Installation

\`\`\`bash
# Custom port
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 8080

# Custom project name
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --name my-trading-bot
\`\`\`

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` with the following:

\`\`\`env
# Security (Required)
SESSION_SECRET="your-random-32-char-secret"
JWT_SECRET="your-random-32-char-secret"
ENCRYPTION_KEY="your-32-char-encryption-key"
API_SIGNING_SECRET="your-api-signing-secret"

# Application (Required)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# Database (Optional - SQLite is used by default)
# Only add DATABASE_URL if you want to use PostgreSQL instead of SQLite
# DATABASE_URL="postgresql://user:password@host:5432/database"
\`\`\`

### Optional Configuration

\`\`\`env
# Data Retention
MARKET_DATA_RETENTION_DAYS=7
INDICATION_STATE_RETENTION_HOURS=48

# Auto Cleanup
ENABLE_AUTO_CLEANUP=true
CLEANUP_INTERVAL_HOURS=24
\`\`\`

---

## Database Setup

### SQLite (Default - Recommended for Single Server)

**Zero Configuration Required:**
- SQLite is automatically used when DATABASE_URL is not set
- Database file: `./data/cts.db`
- Created automatically on first run
- Migrations run automatically

\`\`\`bash
# No database configuration needed!
# Just build and start
npm run build && npm start
\`\`\`

### PostgreSQL (Optional - For Multi-Server or Cloud)

\`\`\`bash
# Create database
createdb cts_v3

# Set connection in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/cts_v3"

# Migrations run automatically on first start
npm run build && npm start
\`\`\`

### Database Migrations

Migrations run automatically on application start:

| Migration | Description |
|-----------|-------------|
| 55 | Preset trade engine tables |
| 56 | Parabolic SAR and common indicators |
| 57 | Indication category support |

---

## System Architecture

### Position Flow (4 Layers)

\`\`\`
Market Data → Indication Processing → Strategy Evaluation
     ↓              ↓                       ↓
  WebSocket    Main/Common           Additional/Adjust
     ↓              ↓                       ↓
Base Pseudo → Main Pseudo → Real Pseudo → Exchange Positions
\`\`\`

### Indication System

**Main Indications** (Step-Based Progression):
- Direction - Trend analysis via SMA crossovers
- Move - Momentum detection via ROC
- Active - Market activity via volatility/volume
- Optimal - Combined scoring algorithm

**Common Indicators** (Technical Analysis):
- RSI - Relative Strength Index
- MACD - Moving Average Convergence Divergence
- Bollinger Bands - Volatility bands
- Parabolic SAR - Trend following (NEW)
- ADX - Trend strength
- ATR - Volatility measurement

### Strategy Categories

**Additional (Purple)** - Enhancement strategies:
- Trailing Stop - Dynamic stop-loss

**Adjust (Blue)** - Position adjustment:
- Block - Predefined position sizing
- DCA - Dollar Cost Averaging

---

## Initial Configuration

### Step 1: Database Initialization

**With SQLite (default):**
- Database automatically initializes on first run
- No manual action needed

**With PostgreSQL:**
- Navigate to Settings → Install → Initialize Database
- Or use API:
\`\`\`bash
curl -X POST https://your-domain.com/api/install/database/init
\`\`\`

### Step 2: Add Exchange Connection

1. Go to Settings → Exchange
2. Select predefined connection or add custom
3. Enter API credentials
4. Test connection
5. Enable connection

### Step 3: Configure Indications

1. Go to Settings → Indication
2. Configure Main indications (Direction, Move, Active, Optimal)
3. Configure Common indicators (RSI, MACD, Bollinger, ParabolicSAR, ADX, ATR)

### Step 4: Configure Strategies

1. Go to Settings → Strategy → Preset
2. Enable/configure Additional strategies (Trailing)
3. Enable/configure Adjust strategies (Block, DCA)

### Step 5: Create Presets

1. Go to Presets page
2. Create Preset Type with strategy configuration
3. Add Configuration Sets with indication filtering

### Step 6: Enable Trading

1. Go to Dashboard
2. Select active connection
3. Start Preset Trade Engine

---

## Monitoring & Maintenance

### System Logs

Access via: Settings → Install → Diagnostics

Or view:
\`\`\`bash
journalctl -u cts-web -f
\`\`\`

### Backup Management

Create backup:
\`\`\`bash
curl -X POST https://your-domain.com/api/install/backup/create \
  -H "Content-Type: application/json" \
  -d '{"name": "pre-update-backup"}'
\`\`\`

### Database Backup (SQLite)

SQLite database can be backed up simply by copying the file:
\`\`\`bash
cp ./data/cts.db ./data/backups/cts-$(date +%Y%m%d).db
\`\`\`

### Health Check

\`\`\`bash
curl https://your-domain.com/api/install/diagnostics
\`\`\`

---

## Security Best Practices

1. **Secrets**: Use strong, unique secrets for all environment variables
2. **API Keys**: Use read-only keys for testing, restrict IP addresses
3. **Database**: 
   - SQLite: Secure file permissions (chmod 600 data/cts.db)
   - PostgreSQL: Enable SSL/TLS, restrict access by IP
4. **HTTPS**: Required for production
5. **Updates**: Regularly update dependencies
6. **Backups**: Create before major changes

---

## Troubleshooting

### Database Connection Failed (SQLite)

\`\`\`bash
# Check data directory exists and is writable
ls -la ./data

# Check SQLite file permissions
ls -la ./data/cts.db

# Verify database file integrity
sqlite3 ./data/cts.db "PRAGMA integrity_check;"
\`\`\`

### Database Connection Failed (PostgreSQL)

\`\`\`bash
# Check PostgreSQL status
pg_isready

# Verify connection string
psql $DATABASE_URL -c "SELECT 1;"
\`\`\`

### Migrations Not Running

Check application logs for migration errors:
\`\`\`bash
journalctl -u cts-web -n 100 | grep migration
\`\`\`

### Exchange Connection Issues

1. Verify API credentials in exchange dashboard
2. Check API permissions (trading, reading)
3. Test connection in Settings → Exchange

### Performance Issues

1. Check data retention settings
2. Enable auto cleanup
3. Review database indexes
4. Consider PostgreSQL for high-load scenarios

---

## Switching Database Types

### From SQLite to PostgreSQL

1. **Export SQLite data** (if you have existing data):
\`\`\`bash
sqlite3 ./data/cts.db .dump > cts-export.sql
\`\`\`

2. **Set DATABASE_URL** in `.env.local`:
\`\`\`env
DATABASE_URL="postgresql://user:password@host:5432/database"
\`\`\`

3. **Import data** (if applicable):
\`\`\`bash
# Convert and import SQL (may need manual adjustments)
psql $DATABASE_URL < cts-export.sql
\`\`\`

4. **Restart application**

### From PostgreSQL to SQLite

1. **Remove DATABASE_URL** from `.env.local`
2. **Restart application** - SQLite will be used automatically
3. **Database will be freshly initialized** (data migration not automatic)

---

## Support

For issues or questions:
1. Check system logs via Settings → Install → Diagnostics
2. Review documentation files
3. Create GitHub issue

---

**System Status**: ✅ Production Ready  
**Default Database**: SQLite (Zero Configuration)
