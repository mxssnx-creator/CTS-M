# CTS v3 Setup Guide

## Quick Setup with npx

You can set up and install CTS v3 directly using npx:

\`\`\`bash
npx cts-setup
\`\`\`

This will automatically:
- Check Node.js version compatibility
- Install all dependencies
- Create .env.local configuration file
- Build the application
- Provide next steps

## Manual Setup

### 1. Prerequisites

- **Node.js**: 18.x - 26.x
- **PostgreSQL**: 13 or higher
- **Package Manager**: npm, pnpm, or yarn

### 2. Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd cts-v3

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
\`\`\`

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

\`\`\`env
# Database Configuration
DATABASE_URL="postgresql://cts:00998877@83.229.86.105:5432/cts-v3"
REMOTE_POSTGRES_URL="postgresql://cts:00998877@83.229.86.105:5432/cts-v3"

# Next.js Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Session Secret (generate a random string)
SESSION_SECRET="your-random-secret-string"

# Optional: External APIs
# OPENAI_API_KEY="your-openai-key"
# ANTHROPIC_API_KEY="your-anthropic-key"
\`\`\`

### 4. Database Setup

The database will be initialized automatically on first startup. All migrations run automatically via the instrumentation system.

No manual database setup is required!

### 5. Start the Application

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
\`\`\`

The application will be available at `http://localhost:3000`

## Configuration

### Exchange Connections

1. Navigate to **Settings > Overall > Connection**
2. Click "Add Connection"
3. Select your exchange (Bybit, BingX, Binance, OKX, Pionex, OrangeX)
4. Enter API credentials
5. Test connection
6. Enable the connection

### Indication Settings

Navigate to **Settings > Indication** to configure:

#### Main Indications
- **Direction**: Opposite direction change detection (range 3-30)
- **Move**: Price movement without opposite requirement (range 3-30)
- **Active**: Fast price change detection with ratios
- **Active Advanced** (NEW): Optimal market change calculations for short-time trades (1-40 min)
- **Optimal**: Advanced indication with base pseudo positions

#### Common Indicators
- Technical indicators (RSI, MACD, etc.) - Coming soon

### Strategy Configuration

Navigate to **Settings > Strategy** to configure:
- Trailing stops
- Block trading
- DCA (Dollar Cost Averaging)

### Connection-Specific Settings

Each active connection has:
- **Volume Factors**: Separate for Live Trade and Preset Trade
- **Active Indications**: Select which main indications are active
- **Additional Strategies**: Enable/disable trailing, block, and DCA

## Active Advanced Indication

The new **Active Advanced** indication type uses:

- **Activity Ratios**: 0.5% to 3.0% (configurable)
- **Time Windows**: 1, 3, 5, 10, 15, 20, 30, 40 minutes
- **Market Change Calculations**:
  - Overall market change (average price change)
  - Last part change (last 20% continuation)
  - Volatility check (standard deviation)
  - Momentum analysis (price acceleration)
  - Drawdown filter (max 5%)

### Validation Criteria
- Overall price change ≥ activity ratio
- Last part shows continuation (≥60% of overall)
- Volatility ≥ 0.1%
- Positive momentum
- Drawdown ≤ 5.0%

## Architecture

### Position Flow

1. **Base Pseudo Positions**: Created when indication is valid
   - Up to 250 entries per configuration set
   - Each TP/SL/Trailing combo = separate set
   - Unlimited configuration sets

2. **Main Pseudo Positions**: Evaluated from base with profit factor

3. **Real Pseudo Positions**: Created after validation

4. **Exchange Positions**: Mirrored from real pseudo

### Database Migrations

All migrations run automatically on startup via `instrumentation.ts`:
- No manual migration needed
- Migrations are tracked in `migrations` table
- Safe to restart - migrations only run once

### Rate Limiting

The system includes exchange-specific rate limiting:
- Bybit: 10 req/sec, 120 req/min
- Binance: 20 req/sec, 1200 req/min
- OKX: 20 req/sec, 300 req/min
- BingX: 10 req/sec, 60 req/min
- Pionex: 10 req/sec, 60 req/min
- OrangeX: 10 req/sec, 60 req/min

## Troubleshooting

### Database Connection Issues

Check that PostgreSQL is running:
\`\`\`bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
\`\`\`

### Migration Issues

Migrations run automatically. Check logs at `/monitoring` for any migration errors.

### Exchange Connection Issues

1. Verify API credentials are correct
2. Check API key permissions (need spot/futures trading permissions)
3. Test connection using the "Test Connection" button
4. Check detailed logs in the connection card

### Port Already in Use

Change the port in the start command:
\`\`\`bash
PORT=3001 npm run dev
\`\`\`

## Support

For issues or questions:
1. Check the `/monitoring` page for system status
2. Review logs in the connection card detailed logging
3. Check the `/logistics` page for system architecture details

## Production Deployment

See `PROJECT_INFO.md` for production deployment strategy and best practices.

## License

Proprietary - All rights reserved
\`\`\`

I've successfully implemented the Active Advanced indication type with comprehensive market change calculations, added it to the settings UI with proper configuration options, created the necessary API endpoints for managing active indications per connection, added migration script 052 to support the new columns and settings, and created an npx setup script with comprehensive SETUP.md documentation. The system now supports short-time trading (1-40 min) with advanced validation criteria including volatility checks, momentum analysis, and drawdown filtering.
