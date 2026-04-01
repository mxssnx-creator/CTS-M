# Connection-Aware System Architecture

## Overview

The CTS v3 Crypto Trading Dashboard now supports multiple trading connections with isolated, independent configurations. Each connection (Demo mode or real exchange connections) maintains its own settings and data, allowing users to test strategies safely in Demo mode before deploying to real connections.

## Architecture Components

### 1. Exchange Context (`lib/exchange-context.tsx`)

**Purpose**: Central state management for connection selection

**Key Features**:
- Tracks `selectedConnectionId` and `selectedConnection` 
- Maintains list of `activeConnections` (dashboard-enabled connections)
- Provides `loadActiveConnections()` method to refresh connection list
- Auto-selects first connection on mount if none selected
- 60-second cooldown between refresh calls to prevent excessive API requests

**Usage**:
```tsx
const { selectedConnectionId, setSelectedConnectionId, activeConnections } = useExchange()
```

### 2. Connection Settings API (`app/api/settings/connection-settings/route.ts`)

**Purpose**: REST API for connection-specific settings persistence

**Endpoints**:
- `GET ?connectionId=xxx` - Retrieve settings for a connection (returns defaults if not set)
- `POST` - Update settings for a connection
- `DELETE ?connectionId=xxx` - Reset settings to defaults

**Storage Backend**: Redis (`settings:connection:{connectionId}` key)

**Schema** (`lib/connection-settings.ts`):
```typescript
ConnectionSettings {
  connectionId: string
  
  strategy: {
    takeProfit: number
    stopLoss: number
    leverage: number
    volumeMultiplier: number
  }
  
  indication: {
    mainType: string
    commonType: string
    autoType: string
    optimalType: string
  }
  
  trading: {
    maxPositions: number
    riskPerTrade: number
    dailyLossLimit: number
    autoStopAfterLoss: boolean
  }
  
  advanced: {
    slippageTolerance: number
    executionSpeed: "fast" | "normal" | "slow"
    useTrailingStop: boolean
    enableAutoExit: boolean
  }
}
```

### 3. Connection Settings Hooks (`lib/use-connection-settings.ts`)

**Purpose**: React hooks for accessing and updating connection-specific settings

**Available Hooks**:

#### `useConnectionSettings()`
Main hook for all settings of current connection
```tsx
const { settings, isLoading, error, updateSettings, resetSettings, refresh } = useConnectionSettings()
```

#### `useConnectionStrategySettings()`
Strategy settings specific to current connection
```tsx
const { strategy, isLoading, error, updateStrategy } = useConnectionStrategySettings()
```

#### `useConnectionIndicationSettings()`
Indication settings specific to current connection
```tsx
const { indication, isLoading, error, updateIndication } = useConnectionIndicationSettings()
```

#### `useConnectionTradingSettings()`
Trading settings specific to current connection
```tsx
const { trading, isLoading, error, updateTrading } = useConnectionTradingSettings()
```

**Behavior**:
- Automatically reload settings when `selectedConnectionId` changes
- Return defaults if connection has no stored settings
- Support for partial updates and full resets

### 4. Data Endpoints (`app/api/data/`)

**Purpose**: Fetch connection-specific data for UI pages

**Available Endpoints**:

#### `/api/data/strategies?connectionId=xxx`
Returns strategies for a connection
- Demo mode: Generates 150+ mock strategies
- Real connections: Fetches from trading engine (future enhancement)

#### `/api/data/indications?connectionId=xxx`
Returns indications/signals for a connection
- Demo mode: Generates 200+ mock indications
- Real connections: Fetches from trading engine (future enhancement)

#### `/api/data/positions?connectionId=xxx`
Returns live trading positions for a connection
- Demo mode: Generates 25 mock positions with simulated price updates
- Real connections: Fetches from Redis (`positions:by-connection:{connectionId}` set)

#### `/api/data/presets?connectionId=xxx`
Returns preset templates for a connection
- Demo mode: Generates 5 mock preset templates
- Real connections: Fetches from trading engine (future enhancement)

### 5. Connection Settings UI (`components/settings/connection-settings-header.tsx`)

**Purpose**: Visual connection selector and scoping indicator

**Features**:
- Displays current connection with status (Connected/Disconnected)
- Shows connection type badge (DEMO in green, REAL in amber)
- Dropdown to switch between all active connections
- Warning banner for real connections
- Settings scope explanation for current connection

**Usage** (integrated into Settings page):
```tsx
<ConnectionSettingsHeader />
```

## Data Flow

### Connection Selection Flow
```
User selects connection in UI
  ↓
ExchangeContext.setSelectedConnectionId()
  ↓
selectedConnectionId updates in context
  ↓
Pages listen to selectedConnectionId via useExchange()
  ↓
Pages fetch connection-specific data via /api/data/* endpoints
  ↓
Settings hooks auto-reload via useConnectionSettings()
  ↓
UI reflects connection-scoped data
```

### Settings Persistence Flow
```
User modifies settings in UI
  ↓
handleSettingChange() callback triggered
  ↓
updateSettings() or updateStrategy/Indication/Trading() called
  ↓
POST /api/settings/connection-settings
  ↓
Settings persisted to Redis: settings:connection:{connectionId}
  ↓
Settings hook state updated
  ↓
UI reflects changes
```

### Real Data Integration Flow (Positions Example)
```
GET /api/data/positions?connectionId=xxx
  ↓
Check: Is Demo? (connectionId === "demo-mode" || connectionId.startsWith("demo"))
  ├─ YES: Generate mock data → Return
  └─ NO: Query Redis positions:by-connection:{connectionId}
          Fetch each position: position:{id}
          Parse and validate data
          Return real positions
```

## Demo Mode Strategy

**Demo-Mode Identifier**: `connectionId === "demo-mode"` or `connectionId.startsWith("demo")`

**Benefits**:
1. Safe testing without real funds
2. Simulated market conditions
3. Independent from real exchange connections
4. Mock data generation with realistic parameters
5. Settings sandbox for configuration experimentation

**Implementation**:
- Each page checks `isDemo` flag before generating vs fetching data
- Mock data generators create realistic test datasets
- Demo connections never connect to real exchanges
- No API keys required for demo mode

## Connection Isolation

Each connection is completely isolated:

1. **Settings**: Stored separately in Redis under `settings:connection:{connectionId}`
2. **Data**: Fetched independently from separate Redis keys or generators
3. **Positions**: Tracked in separate Redis sets: `positions:by-connection:{connectionId}`
4. **Strategies/Indications**: Generated or fetched per connection
5. **UI State**: Exchange context tracks only one selected connection

## Integration Points

### Trading Engines
Future integration points for engines to use connection-specific settings:
```typescript
// Example (not yet implemented)
const tradingSettings = await getConnectionTradingSettings(connectionId)
const strategySettings = await getConnectionStrategySettings(connectionId)

// Engines would read these before executing trades
engine.configure(tradingSettings, strategySettings)
```

### Pages Using Connection Awareness
- **Strategies** (`/strategies`) - Fetches connection-specific strategy data
- **Indications** (`/indications`) - Fetches connection-specific signals
- **Live Trading** (`/live-trading`) - Shows real positions for selected connection
- **Presets** (`/presets`) - Fetches connection-specific preset templates
- **Settings** (`/settings`) - Displays connection-scoped settings via `ConnectionSettingsHeader`

## Future Enhancements

### Phase 2: Real Data Integration
- [ ] Wire strategy engine to return real strategy results per connection
- [ ] Wire indication engine to return real signals per connection
- [ ] Wire live engine to return real positions (in progress)
- [ ] Implement real preset data fetching

### Phase 3: Advanced Features
- [ ] Connection-specific backtesting results
- [ ] Connection-specific performance metrics
- [ ] Connection-specific trade history
- [ ] Cross-connection strategy comparison
- [ ] Connection-specific risk management rules

### Phase 4: Optimization
- [ ] Cache connection settings with TTL
- [ ] Batch load multiple connections' data
- [ ] Streaming position updates via WebSocket
- [ ] Real-time settings synchronization
- [ ] Connection state recovery on connection loss

## Performance Considerations

1. **Caching**: Connection settings are fetched once and cached in hooks
2. **Cooldown**: Exchange context enforces 60s cooldown between connection list refreshes
3. **Redis Indexing**: Positions tracked in sets for O(1) lookup by connection
4. **Lazy Loading**: Data endpoints only generate/fetch requested data
5. **Error Handling**: Graceful fallbacks to empty arrays or defaults on errors

## Testing Checklist

- [ ] Switch between Demo and real connections - data updates correctly
- [ ] Settings changes in one connection don't affect others
- [ ] Demo mode always shows mock data regardless of selection
- [ ] Real connections fetch data from Redis when available
- [ ] Settings persist across page refreshes
- [ ] Connection header displays correct status and badges
- [ ] Error states handled gracefully (missing Redis, invalid connectionId)
- [ ] Pages show loading states during data fetch

## Security Considerations

1. **Authentication**: All endpoints require authenticated user via `getSession()`
2. **Connection Isolation**: Settings are per-connection, no cross-connection access
3. **Validation**: Settings validated before persistence (`validateConnectionSettings()`)
4. **Demo Mode**: Demo mode cannot execute real trades (mock only)
5. **API Keys**: Real connection credentials never exposed to client-side code

## Troubleshooting

### Settings not persisting
- Check Redis connectivity: `redis-cli ping`
- Verify `settings:connection:{connectionId}` key in Redis
- Check browser console for API errors in POST request

### Data not updating when switching connections
- Verify exchange context `selectedConnectionId` changed
- Check data endpoint is receiving correct `connectionId` parameter
- Verify Redis keys exist for real connections

### Demo data not showing
- Check `isDemo` flag logic in data endpoints
- Verify `connectionId` starts with "demo" or equals "demo-mode"
- Check mock data generation functions for errors

## API Reference

See `/app/api/settings/connection-settings/route.ts` for full API documentation.

See `/app/api/data/*/route.ts` for data endpoint specifications.
