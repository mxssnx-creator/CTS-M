# Connection State Model - Unified Reference

## Core Concept

Connections follow a clear hierarchical model:

### 1. **Predefined Templates** (is_predefined=1)
- 4 Base Templates: `bybit-x03`, `bingx-x01`, `binance-x01`, `okx-x01`
- Additional Templates: `pionex-x01`, `orangex-x01`, `gateio-x01`, `kucoin-x01`, `mexc-x01`, `bitget-x01`, `huobi-x01`
- **State**: `is_inserted=0`, `is_enabled=0`, `is_active_inserted=0`, `is_enabled_dashboard=0`
- **Purpose**: Information/reference only, not for trading
- **Count**: 10-11 total predefined templates

### 2. **User-Created Connections** (is_predefined=0)
- Created by users with their own API credentials
- Can be toggled into different states
- **Count**: Variable (typically 1-4 real connections)

---

## Connection State Fields

| Field | Type | Values | Purpose |
|-------|------|--------|---------|
| `is_predefined` | flag | "0" or "1" | Template vs. User-created |
| `is_inserted` | flag | "0" or "1" | Listed in Settings → Connections |
| `is_enabled` | flag | "0" or "1" | Enabled for use in Trading/Engine |
| `is_active_inserted` | flag | "0" or "1" | Listed in Active Connections panel |
| `is_enabled_dashboard` | flag | "0" or "1" | Enabled toggle in Active panel |
| `is_active` | flag | "0" or "1" | Currently processing by engine |

---

## State Transitions

### Predefined Templates (Fixed)
- Always: `is_predefined=1`
- Always: `is_inserted=0` (not in Settings list)
- Always: `is_enabled=0` (not enabled)
- Always: `is_active_inserted=0` (not in Active panel)
- Always: `is_enabled_dashboard=0` (toggle off)
- Always: `is_active=0` (not processing)
- **Result**: 4 base + 6+ other templates = 10+ predefined connections

### User-Created Connections (Toggleable)

**State 1: Created but Disabled (default)**
```
is_predefined=0
is_inserted=1 (or 0, depending on visibility)
is_enabled=0
is_active_inserted=0
is_enabled_dashboard=0
is_active=0
```

**State 2: Added to Active Panel (not enabled)**
```
is_predefined=0
is_inserted=1
is_enabled=0
is_active_inserted=1  ← Added to Active panel
is_enabled_dashboard=0 ← NOT enabled (toggle is OFF)
is_active=0
```

**State 3: Enabled for Processing**
```
is_predefined=0
is_inserted=1
is_enabled=1          ← Enabled in Settings
is_active_inserted=1  ← In Active panel
is_enabled_dashboard=1 ← Toggle is ON (enabled)
is_active=1           ← Engine processing this connection
```

---

## System Metrics (Smart Overview)

### "Exchange Connections"
- **Count**: 6 base exchange types (Bybit, BingX, Binance, OKX, PionEx, OrangeEx)
- **Source**: `BASE_EXCHANGES` in system-stats-v3
- **Filter**: User-created connections with base exchange type

### "Enabled"
- **Count**: Base exchange connections with `is_enabled=1`
- **Purpose**: How many user connections are enabled for trading

### "Testing/Working"
- **Count**: Connections that passed last API test
- **Source**: `last_test_status`, `test_status`, or `connection_status` fields

### "Active Connections Panel"
- **Count**: Connections with `is_active_inserted=1`
- **Status**: "Established" if `is_enabled_dashboard=1`, else "Disabled"

---

## Migration Logic

**Migration 015**: Initialize all predefined templates
- Marks 4 base templates as `is_predefined=1`
- Sets all to `inserted=0, enabled=0, active_inserted=0`
- Result: 10+ predefined templates appear nowhere in UI

**Migration 016**: Ensure template consistency
- Verifies base templates stay as pure templates
- Resets user-created connection dashboard state
- Result: Clean state separation between templates and real connections

---

## Quick Reference: "4 vs 8" Issue

**The 4**: 4 base exchange templates (bybit-x03, bingx-x01, binance-x01, okx-x01)

**The 8**: Could be:
- 4 base + 4 other predefined templates = 8 total predefined
- OR 4 base templates counted twice in different systems
- OR old code mixing template IDs with user connection IDs

**Fix**: Use `is_predefined=1` filter to separate templates (10+) from user connections (0-4)

---

## System-Stats Counting Logic

```typescript
// Get all connections
const allConnections = await getAllConnections()

// Separate predefined from user-created
const predefinedConnections = allConnections.filter(c => c.is_predefined === "1")
const userCreatedConnections = allConnections.filter(c => c.is_predefined !== "1")

// Count base exchanges (user-created only)
const BASE_EXCHANGES = ["bybit", "bingx", "pionex", "orangex", "binance", "okx"]
const baseConnections = userCreatedConnections.filter(c => 
  BASE_EXCHANGES.includes(c.exchange?.toLowerCase())
)

// This gives correct metrics:
// - baseConnections: 0-4 (user-created, e.g., 1 Bybit, 1 BingX, 0 others)
// - enabledBase: subset with is_enabled="1"
// - activeConnections: subset with is_active_inserted="1"
```

---

## Implementation Checklist

- [x] Migration 015: Mark 4 base templates as predefined
- [x] Migration 016: Ensure template consistency  
- [x] system-stats-v3: Count only user-created connections as "base"
- [x] Disable active connections by default (not auto-enabled)
- [x] UI reflects: Predefined templates (10+) separate from Active connections (0-4)
