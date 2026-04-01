## CTS v3.2 - Trade Engine Architecture Summary

### System Architecture

The system now has **independent status management** across three tiers:

#### 1. **Base Connections Layer (Settings)**
- All connections stored in Redis database
- Status tracking: `enabled` and `inserted` 
- Managed by `ConnectionState` context
- Map: `baseConnectionStatuses: Map<string, {enabled, inserted}>`
- API: `/api/settings/connections`
- These are the definitive data source for all exchange connections

#### 2. **ExchangeConnectionsActive Layer (Dashboard)**
- Only enabled connections are loaded here
- Independent `is_active` status separate from Settings
- Managed by `ConnectionState` context
- Map: `exchangeConnectionsActiveStatus: Map<string, boolean>`
- Dashboard connection cards can be toggled independently
- API: `/api/settings/connections?enabled=true`

#### 3. **Trade Engine Layer (Independent)**
- Trade engines can start **WITHOUT any connection being enabled**
- Independent status tracking: idle → starting → running → stopped/failed
- Managed by `ConnectionState` context
- Map: `tradeEngineStatuses: Map<string, TradeEngineStatus>`
- Each engine tracks: cycles, success rate, trades, positions, errors
- Auto-monitors enabled connections every 10 seconds
- API: `/api/trade-engine/status?connectionId=[id]`

### Key Workflows

#### Enabling a Connection (Settings)
1. User toggles connection in Settings
2. `setBaseConnectionStatus(id, true)` called
3. Base connection marked as enabled
4. Background monitor detects enabled connection
5. Trade engine auto-starts (if credentials present)
6. User sees "starting" hint → "running" confirmation

#### Dashboard Active Connections (Independent)
1. Load enabled connections via API
2. Dashboard shows them as separate cards
3. Each card has independent `is_active` toggle
4. Toggle status is **separate from** Settings enabled state
5. Dashboard connections remain active even if Settings disables base
6. Can add/remove dashboard cards without affecting base settings

#### Trade Engine Startup (Fully Independent)
1. Can be triggered without any connection being enabled
2. Via `/api/trade-engine/start` or toggle endpoint
3. Engine status polls independently every 3 seconds per card
4. Shows real-time progression: cycles, success rate, PnL
5. Continues processing regardless of connection settings status
6. Auto-recovery monitoring continues every 10 seconds

### Redis Database Schema

```
connection:{id}          → hash of connection data
connections             → set of connection IDs (all)
trade_engine_state:{id} → hash of engine progression data
trades:{id}             → set of trade IDs
positions:{id}          → set of position IDs
```

### Status Values

**Base Connection Status** (Settings):
- `enabled: true/false` - If connection should be used
- `inserted: true/false` - Temporary flag after creation (5 sec)

**ExchangeConnectionsActive Status** (Dashboard):
- `is_active: true/false` - Independent from settings

**Trade Engine Status**:
- `idle` - Not started/waiting
- `starting` - Initialization in progress
- `running` - Processing trades
- `stopped` - Manually stopped
- `failed` - Error occurred

### API Endpoints

**Settings Connections:**
- `GET /api/settings/connections` - All connections
- `GET /api/settings/connections?enabled=true` - Enabled only
- `POST /api/settings/connections/[id]/toggle` - Enable/disable + auto-start engine
- `PATCH /api/settings/connections/[id]/settings` - Update connection config

**Trade Engine:**
- `GET /api/trade-engine/status` - All engines status
- `GET /api/trade-engine/status?connectionId=[id]` - Single engine status
- `POST /api/trade-engine/start` - Start engine (optional connectionId)
- `POST /api/trade-engine/stop` - Stop engine (optional connectionId)

**Dashboard Monitoring:**
- `GET /api/monitoring/stats` - System-wide statistics
- `GET /api/connections/status/[id]` - Connection real-time status

### Component Integration

**Dashboard Cards:**
1. Load `ExchangeConnectionsActive` (enabled connections only)
2. Poll engine status independently every 3 seconds
3. Show status: starting → running with progression hints
4. Toggle `is_active` to control dashboard display
5. Settings connection status doesn't affect dashboard card

**Settings Panel:**
1. Load `baseConnections` (all connections)
2. Toggle `enabled` status
3. Shows base connection status: enabled/disabled, inserted/not
4. When enabled: trade engine auto-starts if credentials present
5. Shows engine status hints if not running

### Independent Status Resolution

The three-tier system means:
- Settings can show "disabled" while Dashboard shows "active"  
- Trade engine can run while both Settings and Dashboard show "disabled"
- Each layer maintains own status independently
- No dependency between layers for state management
- Perfect isolation for different UI concerns
