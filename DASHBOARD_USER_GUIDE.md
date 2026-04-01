# Modern Trading Dashboard - User Guide

## 🚀 Getting Started

### Access the Dashboard
Open your browser and navigate to:
```
http://localhost:3000/main
```

The main homepage (`/`) will automatically redirect you to the modern dashboard.

---

## 📊 Dashboard Overview

### Header Section
- **Title**: Modern Trading Dashboard
- **Status Cards**: Real-time system metrics
  - Total Connections
  - Active Engines
  - Last Updated timestamp
- **Refresh Button**: Manually refresh data

### Main Content Sections
1. **Active Connections Manager** - Main dashboard area showing all connections from your database
2. **Features Overview** - Quick reference of available features

---

## 🔧 Connection Configuration

Each active connection displays expandable configuration panels:

### 1. Volume Configuration Panel
**Location**: First section in each connection card

**Features**:
- **Live Trade Volume Factor**: Adjust volume for main trading (0.1x to 10x)
- **Preset Trade Volume Factor**: Adjust volume for preset trading (0.1x to 10x)
- **Quick Presets**: Buttons for common multipliers (0.5x, 1x, 1.5x, 2x)
- **Order Type**: Select between Market and Limit orders
- **Volume Type**: Choose USDT or Contract-based volumes

**How to Use**:
1. Drag the slider or click preset buttons to adjust volume factors
2. Select order type from dropdown
3. Choose volume type (USDT for stablecoin amounts, Contract for symbol amounts)
4. Changes take effect immediately

### 2. Order Settings Panel
**Location**: Below volume configuration

**Features**:
- **Market Orders**:
  - Slippage Tolerance: Maximum acceptable price variation (0.1% - 5%)
  - Auto-Execution: Enable/disable automatic order execution

- **Limit Orders**:
  - Price Offset: Distance from market price for limit orders (0.1% - 2%)
  - Order Timeout: How long to wait before canceling unfilled orders (60s - 3600s)

**How to Use**:
1. Configure settings for your preferred order type
2. Adjust sliders for tolerance/offset levels
3. Set timeout durations for limit orders
4. Settings apply to all trades for this connection

### 3. Symbol Management
**Location**: Expandable symbol settings section

**Features**:
- **Search & Filter**: Find symbols quickly
- **Favorites**: Mark important symbols with a star
- **Active/Inactive**: Toggle which symbols are actively traded
- **Statistics**: View 24h price changes and trading volume
- **Add/Remove**: Manage your symbol list

**How to Use**:
1. Use search box to find specific symbols
2. Click star icon to mark as favorite
3. Toggle active/inactive for quick management
4. Add new symbols with the "Add Symbol" button
5. Remove symbols with the trash icon

### 4. Indications Configuration
**Location**: Expandable indications section

**Features**:
- **5 Indicator Categories**:
  - Direction: Trend indicators (RSI, MACD, Stochastic)
  - Movement: Volatility indicators (Bollinger Bands, ATR, Keltner)
  - Active: Market activity indicators
  - Optimal: Specialized indicators for optimal entry/exit
  - Advanced: Complex multi-indicator combinations

- **For Each Indicator**:
  - Enable/disable toggle
  - Parameter configuration (periods, thresholds)
  - Performance preview
  - Alert settings

**How to Use**:
1. Click tabs to switch between indicator categories
2. Toggle indicators on/off with switches
3. Adjust parameters using sliders/inputs
4. View performance metrics for each indicator
5. Configure alerts for indicator signals

### 5. Strategies Configuration
**Location**: Expandable strategies section

**Features**:
- **4 Strategy Categories**:
  - Base: DCA, Trailing, Block strategies
  - Main: Main trade strategies
  - Preset: Preset coordination strategies
  - Advanced: Complex multi-strategy combinations

- **For Each Strategy**:
  - Enable/disable toggle
  - Parameter configuration
  - Performance metrics
  - Backtest results

**How to Use**:
1. Click tabs to switch between strategy categories
2. Toggle strategies on/off
3. Configure strategy parameters
4. Monitor performance metrics
5. Review backtest scores

### 6. Main Trade Card
**Location**: Expandable main trade section

**Features**:
- **Entry Settings**:
  - Indication-based entry
  - Confirmation requirements
  - Size calculation method (Fixed, Percentage, Dynamic)
  - Leverage settings

- **Exit Settings**:
  - Take Profit percentage
  - Stop Loss percentage
  - Trailing stop configuration
  - Time-based exits

- **Position Management**:
  - Maximum total positions
  - Max positions per symbol
  - Position scaling
  - Partial exit rules

- **Statistics**:
  - Active positions count
  - Unrealized PnL (profit/loss)
  - Win rate percentage
  - Maximum daily drawdown

- **Controls**:
  - Start/Pause/Resume/Stop buttons
  - Real-time status indicator
  - Engine activity monitor

**How to Use**:
1. Configure entry signals and requirements
2. Set profit targets and loss limits
3. Define position limits
4. Monitor real-time statistics
5. Use control buttons to manage trading:
   - **Start**: Begin trading on this connection
   - **Pause**: Temporarily stop trading
   - **Resume**: Continue after pause
   - **Stop**: Completely stop trading

### 7. Preset Trade Card
**Location**: Expandable preset trade section

**Features**:
- **Preset Selection**:
  - Available presets list
  - Preset type (Auto-optimal, Conservative, etc.)
  - Backtesting scores
  - Creation dates

- **Configuration**:
  - Auto-update enabled toggle
  - Preset-specific settings
  - Testing progress indicator

- **Statistics**:
  - Coordinated positions count
  - Active trades
  - Preset PnL
  - Expected win rate

- **Controls**:
  - Preset switching
  - Start/Pause/Resume/Stop buttons
  - Configuration buttons

**How to Use**:
1. Select an available preset from the list
2. Review backtesting scores
3. Enable/disable auto-update
4. Monitor coordination statistics
5. Control preset trading with buttons
6. Switch presets as needed for different market conditions

---

## 📈 Real-Time Monitoring

### Dashboard Statistics
The top section shows real-time metrics:
- **Total Connections**: Number of active connections from your database
- **Active Engines**: How many connections are running
- **Last Updated**: Timestamp of latest data refresh

### Live Updates
- Data refreshes every 5 seconds automatically
- Use the "Refresh" button for immediate updates
- All statistics update in real-time

---

## 🎯 Quick Start Guide

### First-Time Setup

1. **Access Dashboard**
   ```
   http://localhost:3000/main
   ```

2. **Review System Status**
   - Check the status cards at the top
   - Verify total connections count matches your database

3. **Select Connection**
   - Find the connection you want to configure
   - Click to expand if collapsed

4. **Configure Volume**
   - Set live volume factor (default 1.0x)
   - Set preset volume factor (default 1.0x)
   - Select order type (Market or Limit)
   - Choose volume type (USDT or Contract)

5. **Set Trading Parameters**
   - Configure entry signals in Indications
   - Select base strategy
   - Set position limits in Main Trade

6. **Start Trading**
   - Click "Start" in Main Trade card
   - Monitor real-time statistics
   - Adjust settings as needed

### Preset Trading Setup

1. **Select Preset**
   - Find your preset in Preset Trade card
   - Review backtesting score

2. **Configure Preset**
   - Enable auto-update if desired
   - Adjust preset-specific parameters

3. **Activate**
   - Click "Start" to begin preset trading
   - Monitor coordination statistics

---

## ⚙️ Advanced Configuration

### Volume Strategy
- **Conservative**: Use 0.5x - 1.0x for lower risk
- **Moderate**: Use 1.0x - 1.5x for balanced risk
- **Aggressive**: Use 1.5x - 2.0x for higher volume

### Order Strategy
- **Market Orders**: For quick execution, higher cost
- **Limit Orders**: For better prices, slower execution

### Risk Management
- Set appropriate Stop Loss percentages
- Use trailing stops for trend protection
- Limit maximum positions
- Monitor maximum drawdown

---

## 📊 Interpreting Metrics

### PnL Metrics
- **Unrealized PnL**: Current profit/loss on open positions
- **Realized PnL**: Actual profit/loss from closed positions
- **PnL %**: Percentage return on invested capital

### Performance Metrics
- **Win Rate**: Percentage of profitable trades
- **Average Profit**: Mean profit per trade
- **Max Drawdown**: Largest peak-to-trough decline

### Position Metrics
- **Active Positions**: Number of currently open trades
- **Total Positions**: Lifetime count of all trades
- **Coordinated Positions**: Preset-coordinated trades

---

## 🔄 Making Changes

### To Adjust Volume Factor
1. Locate Volume Configuration Panel
2. Drag slider or click preset button
3. New value takes effect immediately
4. Changes apply to next trades

### To Change Order Type
1. Open Volume Configuration Panel
2. Click Order Type dropdown
3. Select Market or Limit
4. Order Settings automatically update

### To Update Symbols
1. Expand Symbol Management section
2. Search for symbol
3. Toggle active/favorite status
4. Add/remove as needed
5. Changes reflected immediately

### To Modify Strategies
1. Open Strategies Configuration
2. Select strategy category
3. Toggle on/off or adjust parameters
4. Changes apply to next strategy evaluation

---

## 🛠️ Troubleshooting

### No Connections Showing
- **Cause**: No active connections in database
- **Solution**: Add connections in Settings > Connections

### Data Not Updating
- **Cause**: API connection issue
- **Solution**: 
  - Click "Refresh" button
  - Check network in browser DevTools
  - Verify backend is running

### Settings Not Saving
- **Cause**: API error or network issue
- **Solution**:
  - Check browser console for errors
  - Verify backend is accessible
  - Try refreshing the page

### Trades Not Executing
- **Cause**: Engine stopped or API keys invalid
- **Solution**:
  - Verify API keys in Settings
  - Check engine status indicators
  - Review error logs in Monitoring page

---

## 📱 Mobile & Tablet Usage

The dashboard is responsive and works on all screen sizes:
- **Mobile**: Stack layout, touch-friendly controls
- **Tablet**: Two-column layout
- **Desktop**: Full multi-column layout

Swipe or scroll to navigate on mobile devices.

---

## 🔐 Security Notes

- **API Keys**: Never share your API keys
- **Passwords**: Keep your login credentials secure
- **Database**: Backup regularly before making changes
- **Testnet**: Use testnet for configuration testing before live trading

---

## 📞 Support & Documentation

For more detailed information:
- See `DASHBOARD_MODERNIZATION.md` for feature details
- See `QUICK_REFERENCE.md` for code snippets
- See `VERIFICATION_CHECKLIST.md` for troubleshooting
- Check `LAYOUT_OVERVIEW.md` for visual layout

---

**Version**: 1.0  
**Last Updated**: 2026-03-24  
**Status**: Production Ready
