# Real Data Integration Guide

## Overview

This guide documents how real trading data flows through the CTS v3 system, from exchange connections to the UI.

## Real Data Sources

### 1. **Live Positions** (Fully Implemented ✅)
- **Source**: Redis `positions:by-connection:{connectionId}` set
- **Endpoint**: `/api/data/positions?connectionId=xxx`
- **Data Structure**: 
  ```typescript
  Position {
    id: string
    symbol: string
    side: "LONG" | "SHORT"
    entryPrice: number
    currentPrice: number
    quantity: number
    leverage: number
    unrealizedPnl: number
    unrealizedPnlPercent: number
    takeProfitPrice?: number
    stopLossPrice?: number
    createdAt: string
    status: "open" | "closing" | "closed"
  }
  ```
- **Pages Using**:
  - `/live-trading` - Real-time position display with PnL calculations
  - Dashboard positions widgets
- **Behavior**:
  - Real connections: Fetches from Redis via `positions:by-connection:{id}` set
  - Demo mode: Generates 25 mock positions with simulated price updates

### 2. **Strategies** (Fully Implemented ✅)
- **Source**: Redis via `lib/db-helpers.ts` (`getActiveStrategies()`, `getBestPerformingStrategies()`)
- **Endpoint**: `/api/data/strategies?connectionId=xxx`
- **Data Structure**: StrategyResult from StrategyEngine
- **Redis Keys**:
  - `strategies:{connectionId}` - Active strategy IDs set
  - `strategy:{id}` - Strategy hash with profit_factor, win_rate, etc.
- **Pages Using**:
  - `/strategies` - Strategy performance analysis and filtering
- **Behavior**:
  - Real connections: Queries active strategies first, falls back to best performing
  - Demo mode: Generates 150+ strategies via StrategyEngine
  - Returns count field for monitoring

### 3. **Indications/Signals** (Fully Implemented ✅)
- **Source**: Redis via `lib/db-helpers.ts` (`getActiveIndications()`, `getBestPerformingIndications()`)
- **Endpoint**: `/api/data/indications?connectionId=xxx`
- **Data Structure**:
  ```typescript
  Indication {
    id: string
    symbol: string
    indicationType: string
    direction: "UP" | "DOWN" | "NEUTRAL"
    confidence: number
    strength: number
    timestamp: string
    enabled: boolean
    metadata?: {
      macdValue?: number
      rsiValue?: number
      volatility?: number
    }
  }
  ```
- **Redis Keys**:
  - `indication_set:{connectionId}:{symbol}:{type}:*` - Indication entries per config
  - `indication:{id}` - Individual indication data
- **Pages Using**:
  - `/indications` - Signal analysis and technical metrics display
- **Behavior**:
  - Real connections: Queries active indications, converts to Indication interface
  - Demo mode: Generates 200+ indications with realistic technical metrics
  - Extracts metadata from Redis objects (RSI, MACD, volatility)

### 4. **Presets** (Partially Implemented)
- **Source**: Configuration-based templates
- **Endpoint**: `/api/data/presets?connectionId=xxx`
- **Data Structure**: PresetTemplate with strategy config and stats
- **Pages Using**:
  - `/presets` - Preset management and testing
- **Behavior**:
  - Demo mode: Returns 5 mock preset templates
  - Real connections: Returns stored presets from system

### 5. **Settings** (Fully Implemented ✅)
- **Source**: Redis `settings:connection:{connectionId}` JSON
- **Endpoint**: `/api/settings/connection-settings?connectionId=xxx`
- **Data Structure**: ConnectionSettings with strategy, indication, trading, advanced sections
- **Pages Using**:
  - `/settings` - All settings pages and tabs
  - Trading engines read settings before executing
- **Behavior**:
  - Returns defaults if connection not configured
  - Persists changes immediately to Redis
  - Each connection maintains isolated settings

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Pages                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Strategies   │  │ Indications  │  │ Live Trading │           │
│  │ Presets      │  │ Settings     │  │ Monitoring   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────┬──────────────────────────────────────────────┘
                   │ useExchange(selectedConnectionId)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              Exchange Context / Connection Selection            │
│  - selectedConnectionId (demo-mode or real connection ID)      │
│  - activeConnections (dashboard-enabled connections)           │
│  - selectedConnection (full connection object)                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Fetch /api/data/* endpoints
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                Data API Layer (/api/data/*)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ /strategies  │  │ /indications │  │ /positions   │           │
│  │ /presets     │  │ /settings    │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Demo Mode: Generate mock data                                  │
│  Real Mode: Fetch from Redis/DB                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Query Redis / Generate Data
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Data Sources                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Redis                                                   │   │
│  │  - positions:by-connection:{id}                         │   │
│  │  - position:{id} (full position data)                   │   │
│  │  - strategies:{id} (strategy IDs set)                   │   │
│  │  - strategy:{id} (strategy hash)                        │   │
│  │  - indication_set:{id}:{symbol}:{type}:* (signals)     │   │
│  │  - settings:connection:{id} (connection settings)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Trading Engines                                         │   │
│  │  - Generate strategies based on indications             │   │
│  │  - Execute trades and track positions                   │   │
│  │  - Update Redis with new data                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Connection-Aware Pages Status

### Core Trading Pages ✅
- **✅ Strategies** (`/strategies`) - Fetches real strategies via API
- **✅ Indications** (`/indications`) - Fetches real signals via API
- **✅ Live Trading** (`/live-trading`) - Fetches real positions via Redis
- **✅ Presets** (`/presets`) - Fetches connection-specific presets
- **✅ Settings** (`/settings`) - Displays and manages connection settings

### Monitoring & Analytics ✅
- **✅ Statistics** (`/statistics`) - Connection-aware analytics and AI recommendations
- **✅ Monitoring** (`/monitoring`) - Connection-specific system monitoring
- **✅ Active Exchange** (`/active-exchange`) - Displays active connections

### Dashboard Pages ✅
- **✅ Dashboard** (`/`) - Shows active connections and system overview
- **✅ Health** (`/health`) - System health per connection

### Partial Implementation
- **⚠️ Alerts** (`/alerts`) - Needs connection scoping
- **⚠️ Analysis** (`/analysis`) - Needs connection filtering
- **⚠️ Logistics** (`/logistics`) - Needs connection scoping

## Integration Testing Checklist

### 1. Demo Mode Testing
- [ ] Navigate to Strategies page, verify 150+ mock strategies displayed
- [ ] Navigate to Indications page, verify 200+ mock signals displayed
- [ ] Navigate to Live Trading page, verify 25 mock positions displayed
- [ ] Verify "DEMO MODE" badge appears on all pages
- [ ] Check that price updates happen every 2 seconds on Live Trading

### 2. Real Connection Testing
- [ ] Configure a real exchange connection (BingX, Bybit, etc.)
- [ ] Navigate to Strategies page, verify real strategies from engine
- [ ] Navigate to Indications page, verify real signals from engine
- [ ] Navigate to Live Trading page, verify real positions from Redis
- [ ] Verify "REAL CONNECTION" badge with amber color
- [ ] Check system shows "live data from {exchange}"

### 3. Connection Switching
- [ ] Start in Demo mode, observe mock data
- [ ] Switch to real connection via connection header dropdown
- [ ] Verify data updates to real data (if connection has activity)
- [ ] Switch back to demo mode, verify mock data returns
- [ ] Repeat 5+ times, verify smooth transitions

### 4. Settings Isolation
- [ ] In Demo mode, modify strategy settings
- [ ] Switch to real connection, verify settings are different
- [ ] Modify real connection settings
- [ ] Switch back to demo, verify demo settings unchanged
- [ ] Refresh page, verify settings persist

### 5. Data Persistence
- [ ] Execute a trade on real connection, verify position appears on Live Trading
- [ ] Refresh page, verify position still appears
- [ ] Wait 30 seconds, verify position data updates
- [ ] Switch connections and back, verify position remains

### 6. Error Handling
- [ ] Disconnect Redis, verify graceful fallback to empty data
- [ ] Reconnect Redis, verify data reappears
- [ ] Try invalid connectionId in URL, verify error message
- [ ] Try unauthenticated request to /api/data endpoints, verify 401 response

### 7. Performance
- [ ] Load Strategies page with 150+ items, measure load time (should be <2s)
- [ ] Load Indications page with 200+ items, measure load time (should be <2s)
- [ ] Scroll through Live Trading positions, verify smooth 60fps
- [ ] Switch between multiple connections rapidly (10x), verify no memory leaks

### 8. Cross-Page Consistency
- [ ] Open Live Trading and Monitoring in split screen
- [ ] Execute trade via Live Trading API
- [ ] Verify position appears in both pages
- [ ] Verify timestamp and PnL calculations match

## API Response Examples

### Success Response (Strategies)
```json
{
  "success": true,
  "data": [
    {
      "id": "strategy-001",
      "name": "Direction Base",
      "avg_profit_factor": 1.2,
      "win_rate": 65,
      "config": {
        "takeprofit_factor": 8.5,
        "stoploss_ratio": 0.75,
        "leverage": 5,
        "volume_factor": 1.0
      },
      "stats": {
        "positions_per_day": 3.5,
        "recent_trades": 15,
        "profitable": 10
      },
      "isActive": true,
      "validation_state": "valid"
    }
  ],
  "isDemo": false,
  "connectionId": "bybit-x03",
  "count": 47
}
```

### Success Response (Positions)
```json
{
  "success": true,
  "data": [
    {
      "id": "pos-12345",
      "symbol": "BTCUSDT",
      "side": "LONG",
      "entryPrice": 45000,
      "currentPrice": 46500,
      "quantity": 0.5,
      "leverage": 5,
      "unrealizedPnl": 3750,
      "unrealizedPnlPercent": 3.33,
      "takeProfitPrice": 47000,
      "stopLossPrice": 44000,
      "createdAt": "2026-03-25T10:30:00Z",
      "status": "open"
    }
  ],
  "isDemo": false,
  "connectionId": "bybit-x03"
}
```

### Error Response
```json
{
  "success": false,
  "error": "connectionId query parameter required",
  "status": 400
}
```

## Troubleshooting Real Data Issues

### No data showing for real connection
1. Verify connection is enabled in Settings
2. Check Redis connection: `redis-cli ping`
3. Verify Redis keys exist: `redis-cli keys positions:by-connection:*`
4. Check engine is running: `/api/connections/{id}/status`
5. Review engine logs: `/api/connections/{id}/logs`

### Settings not being read by engines
1. Verify settings saved: `redis-cli get settings:connection:{id}`
2. Check engine picks up connection ID correctly
3. Verify `useConnectionTradingSettings()` hook in engine
4. Check settings validation hasn't rejected configuration

### Connection switching causes data loss
1. Verify Redis TTL isn't expiring data
2. Check connection settings are properly isolated
3. Ensure exchange context state isn't being reset
4. Monitor network requests for failed API calls

### Performance issues with large datasets
1. Implement pagination on Strategies page (150+ items)
2. Add lazy-loading to Indications page (200+ items)
3. Implement virtual scrolling for long position lists
4. Cache connection settings to reduce API calls

## Future Enhancements

- [ ] Real-time WebSocket updates for positions
- [ ] Historical trade data persistence
- [ ] Advanced filtering on real data
- [ ] Cross-connection analytics
- [ ] Real-time alerts based on position changes
- [ ] Trade history and journaling
- [ ] PnL analysis per connection
