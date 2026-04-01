# BingX Live Trading - Quick Start Guide

## System Status: READY ✓

All exchange connectors have been fixed and are production-ready. The system is fully operational for BingX live trading with the modernized dashboard components.

## Pre-requisites

1. **BingX Account** - https://www.bingx.com
2. **API Credentials** from BingX:
   - API Key
   - API Secret
3. **Modern Dashboard Loaded** - Access at `http://localhost:3000/`

## Step-by-Step Setup

### 1. Access BingX Connection Settings

1. Open the dashboard at **http://localhost:3000/**
2. Look for **"Active Connections"** section
3. Find **"BingX"** in the connections list
4. Click on the **BingX card** to expand it

### 2. Enter Your BingX API Credentials

The connection card now has:
- **Volume Configuration Panel** - Set volume factors for Live/Preset trading
- **Order Settings** - Choose between Market/Limit orders with conditional parameters  
- **API Credential Fields:**
  - API Key: `[paste your BingX API key here]`
  - API Secret: `[paste your BingX API secret here]`

### 3. Configure Trading Preferences

#### Volume Configuration
- **Live Volume Factor:** Adjust base position size for main trading (0.5 - 2.0)
- **Preset Volume Factor:** Adjust position size for preset strategies (0.5 - 2.0)
- **Volume Type:** Choose USDT or Contract (Symbol Volume Amount)

#### Order Settings
- **Order Type:** Market or Limit
- **Market Orders:**
  - Slippage Tolerance: 1%
  - Auto Execution: Enabled
- **Limit Orders:**
  - Price Offset: 0.5%
  - Timeout: 300 seconds

### 4. Test Your Connection

1. Click **"Test Connection"** button on the BingX card
2. The system will:
   - Verify API credentials
   - Fetch account balance
   - Check trading permissions
3. Wait for **✓ Success** confirmation message
4. View balance and trading limits in the response

### 5. Configure Main Trade Settings

The **Main Trade Card** shows:

**Entry Settings:**
- **Indication Based:** Use indicators to trigger entries
- **Confirmation Required:** 2 signals before entering
- **Size Calculation:** Percentage-based or fixed amount

**Exit Settings:**
- **Take Profit:** 5% default
- **Stop Loss:** 2% default
- **Trailing Stop:** Optional

**Position Management:**
- **Max Total Positions:** 10
- **Max Per Symbol:** 2
- **Position Scaling:** Enabled for pyramid entries
- **Partial Exit Rules:** Configure exit strategy

### 6. Configure Preset Trading (Optional)

The **Preset Trade Card** allows:

**Preset Selection:**
- Auto-Optimal: AI-tuned indicators and strategies
- Conservative: Low-risk setup
- Custom presets you create

**Auto-Update:**
- Enable automatic parameter adjustment
- Based on real-time performance

**Testing:**
- Backtest new presets before going live
- View backtest scores
- Compare performance

### 7. Start Live Trading

1. In the **Main Trade Card**, click **"Start"**
2. In the **Preset Trade Card** (if enabled), click **"Start"**
3. Monitor:
   - Active positions in statistics
   - Unrealized P&L
   - Win rate and metrics

## Real-Time Data Flow

The trading system now operates with:

**Symbol Settings:**
- Search and filter trading pairs
- Set per-symbol configuration
- Real-time price data from BingX

**Indications System:**
- Direction indicators (Bullish/Bearish)
- Movement indicators (Momentum, Volatility)
- Active zone indicators
- Optimal entry indicators
- Advanced technical analysis

**Strategies System:**
- Base strategies (Trailing, Block, DCA)
- Main trade strategies
- Preset trading strategies
- Advanced strategy combinations

## Volume Factor Calculation

**Live Trade Position Size:**
```
Base Volume (from settings) × Live Volume Factor = Position Size
Example: 100 USDT × 1.5 = 150 USDT position
```

**Preset Trade Position Size:**
```
Base Volume × Preset Volume Factor = Preset Position Size
Example: 100 USDT × 1.0 = 100 USDT position
```

## Order Type Behavior

### Market Orders
- Instant execution
- Slippage tolerance: 1%
- Best for volatile market conditions
- Guaranteed entry

### Limit Orders
- Price-specific execution
- Price offset: 0.5% below market
- Timeout: 300 seconds
- Better fills, may miss entry

## Monitoring & Control

The dashboard provides real-time:

**Main Trade Statistics:**
- Active Positions: Real count
- Unrealized PnL: Total profit/loss
- Win Rate: Percentage of profitable trades
- Max Daily Drawdown: Risk metric
- Average Entry Price: Position average

**Preset Trade Statistics:**
- Coordinated Positions: Cross-symbol positions
- Test Progress: Backtest completion
- Active Trades: Currently executing
- Preset PnL: Strategy profit/loss
- Expected Win Rate: Estimated success rate

## Troubleshooting

### Connection Test Fails
- **Check:** API key and secret are correct
- **Verify:** API permissions include Trading
- **Confirm:** Using Testnet/Live setting correctly

### Orders Not Executing
- **Check:** Account has sufficient balance
- **Verify:** Pair is tradable on BingX
- **Confirm:** Order type (Market/Limit) settings

### Low Win Rate
- **Review:** Entry indication settings
- **Adjust:** Take profit/stop loss percentages  
- **Analyze:** Strategy parameters via backtest

## Advanced Features

### Volume Type Selection
- **USDT:** Trade with dollar amount
- **Contract:** Trade with specific amount of asset

### Position Scaling
- Start with base position
- Add to positions on favorable signals
- Reduce risk with pyramid strategy

### Partial Exit Rules
- Exit portions at different profit levels
- Lock in gains progressively
- Maintain exposure on hot trades

## Safety Features

✓ Max position limits prevent over-leverage
✓ Daily loss limits protect capital
✓ Drawdown controls activate safety stops
✓ Confirmation delays prevent false entries
✓ Position scaling prevents excessive risk

## Next Steps

1. Start with small volume factors (0.5-1.0)
2. Test with Testnet first
3. Monitor first few trades manually
4. Adjust strategies based on performance
5. Gradually increase volume factors

## Support Resources

- Check **DASHBOARD_USER_GUIDE.md** for detailed UI walkthrough
- Review **DASHBOARD_COMPLETE.md** for architecture overview
- See **DEBUG_FIXES_COMPLETE.md** for technical implementation details
- BingX API Docs: https://bingx-api.github.io/

---

**Status:** ✓ System Ready for BingX Live Trading
**Last Updated:** 2026-03-24
**Version:** CTS v3.2 Modernized
