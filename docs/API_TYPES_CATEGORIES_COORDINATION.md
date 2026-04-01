# Comprehensive API Types and Categories Coordination Guide

## Overview
This document defines the complete API response type system, categories, and retrieval patterns for the trading system. All APIs must conform to these specifications for consistency, type safety, and proper error handling.

## API Category Hierarchy

```
system.*                           # System Operations
├── system.health                  # Health checks
├── system.database                # Database operations
└── system.settings                # System configuration

connections.*                      # Connection Management
├── connections.crud               # Create, Read, Update, Delete
├── connections.status             # Real-time status
├── connections.test               # Test connection
└── connections.active             # Active/enabled state

trading.*                          # Trading Operations
├── trading.engine                 # Engine status & management
├── trading.orders                 # Order operations
├── trading.positions              # Position management
└── trading.progression            # Cycle tracking

data.*                             # Data & Analytics
├── data.market                    # Market data
├── data.sync                      # Data synchronization
└── data.backtest                  # Backtesting

monitoring.*                       # Monitoring & Alerts
├── monitoring.alerts              # System alerts
├── monitoring.logs                # Event logs
└── monitoring.stats               # Statistics

indication.*                       # Indications & Signals
├── indication.config              # Indication settings
└── indication.active              # Active indications

preset.*                           # Preset Management
├── preset.management              # CRUD operations
└── preset.test                    # Preset testing

audit.*                            # Audit & Compliance
└── audit.logs                     # Audit trail
```

## Type Categories - System vs Trading

### SYSTEM Categories
- **Purpose**: Configuration, monitoring, infrastructure
- **Examples**: health.check, system.settings, monitoring.alerts
- **Response Format**: Standard system response with metadata
- **Caching**: OK (data changes infrequently)
- **Real-time**: Not required

### TRADING Categories
- **Purpose**: Active trading operations, positions, orders
- **Examples**: trading.orders, trading.positions, trading.engine
- **Response Format**: Must include current state and timestamps
- **Caching**: Limited (real-time data)
- **Real-time**: Required

### INDICATION Categories
- **Purpose**: Indication configuration and status
- **Examples**: indication.config (active indicators)
- **Response Format**: Configuration plus status
- **Caching**: Limited (changes frequently)
- **Real-time**: Required for active indications

## API Response Structure

All API responses MUST follow this structure:

```typescript
{
  success: boolean
  timestamp: string                 // ISO 8601 format
  category: string                  // From APICategories registry
  data?: T                          // Typed response data
  error?: string                    // Error message if failed
  details?: any                     // Additional error context
  statusCode: number                // HTTP status code
}
```

## Type Retrieval Patterns

### Pattern 1: Single Resource Retrieval
**Used for**: Individual connections, positions, orders
**Category Format**: `entity.crud` or `entity.read`
**Example**: `/api/connections/[id]` → `connections.crud`

```typescript
GET /api/connections/[id]
Response: ConnectionResponse {
  category: 'connections.crud'
  data: ExchangeConnection
}
```

### Pattern 2: List Retrieval with Filtering
**Used for**: All connections, active positions, orders by status
**Category Format**: `entity.list`
**Example**: `/api/orders?status=pending` → `trading.orders`

```typescript
GET /api/orders?status=pending
Response: APIResponse {
  category: 'trading.orders'
  data: Order[]
}
```

### Pattern 3: Status/Health Checks
**Used for**: Real-time status, health checks, engine status
**Category Format**: `entity.status`
**Example**: `/api/trade-engine/status` → `trading.engine`

```typescript
GET /api/trade-engine/status
Response: TradeEngineStatusResponse {
  category: 'trading.engine'
  data: { running, total_trades, ... }
}
```

### Pattern 4: Configuration/Settings
**Used for**: System settings, indication config
**Category Format**: `entity.config`
**Example**: `/api/settings/connections/[id]/active-indications` → `indication.config`

```typescript
GET /api/settings/connections/[id]/active-indications
Response: ActiveIndicationsResponse {
  category: 'indication.config'
  data: { direction, move, active, optimal, auto }
}
```

### Pattern 5: Operations (Actions)
**Used for**: Test connection, create order, start engine
**Category Format**: `entity.action`
**Example**: `/api/connections/test` → `connections.test`

```typescript
POST /api/connections/test
Response: ConnectionTestResponse {
  category: 'connections.test'
  data: { status, balance, message }
}
```

## Indication Type Constants

All indication types must conform to:

```typescript
type IndicationType = "direction" | "move" | "active" | "optimal" | "auto"
```

**Category Mapping**:
- `direction` - Directional movement indication
- `move` - Market movement indication
- `active` - Market activity level indication
- `optimal` - Optimal conditions indication
- `auto` - Advanced/auto optimal indication (previously active_advanced)

## API Endpoint Categories

### System Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/system/health-check` | GET | `system.health` | HealthCheckResponse |
| `/api/system/status` | GET | `system.health` | StatusResponse |
| `/api/settings/*` | GET/PUT | `system.settings` | SystemSettingsResponse |

### Connection Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/connections` | GET | `connections.crud` | ConnectionListResponse |
| `/api/connections/[id]` | GET | `connections.crud` | ConnectionResponse |
| `/api/connections/test` | POST | `connections.test` | ConnectionTestResponse |
| `/api/trade-engine/status` | GET | `connections.status` | ConnectionStatusResponse |

### Trading Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/orders` | GET/POST | `trading.orders` | OrderResponse |
| `/api/positions` | GET | `trading.positions` | PositionResponse |
| `/api/trade-engine/status` | GET | `trading.engine` | TradeEngineStatusResponse |

### Indication Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/settings/connections/[id]/active-indications` | GET/PUT | `indication.config` | ActiveIndicationsResponse |
| `/api/settings/connections/[id]/indications` | GET/PUT | `indication.config` | IndicationSettingsResponse |

### Monitoring Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/monitoring/alerts` | GET | `monitoring.alerts` | AlertResponse |
| `/api/monitoring/stats` | GET | `monitoring.stats` | StatsResponse |

### Audit Endpoints
| Endpoint | Method | Category | Returns |
|----------|--------|----------|---------|
| `/api/audit-logs` | GET | `audit.logs` | AuditLogResponse |

## Redis Key Naming Convention

Redis keys must follow this pattern for type clarity:

```
{category}:{entity_id}:{field}
{category}:{entity_id}

Examples:
connections:bybit-x01              # Connection data
positions:bybit-x01:BTC/USDT       # Position by symbol
orders:bybit-x01:pending           # Orders by status
indication.config:bybit-x01        # Indication settings
active_indications:bybit-x01       # Active indicator status
```

## Validation Rules

1. **All API responses must include**:
   - ✓ `success` boolean
   - ✓ `timestamp` in ISO 8601 format
   - ✓ `category` from APICategories registry
   - ✓ Either `data` (success) or `error` (failure)
   - ✓ `statusCode` matching HTTP status

2. **Category must match endpoint**:
   - Connection endpoints → `connections.*`
   - Trading endpoints → `trading.*`
   - System endpoints → `system.*`
   - Indication endpoints → `indication.*`

3. **No mixing of categories**:
   - Don't return `trading.orders` from a health check endpoint
   - Don't return `system.health` from an orders endpoint

4. **Type consistency**:
   - Use `"auto"` for auto optimal indications (not `"active_advanced"`)
   - Use `"optimal"` for optimal conditions (distinct from `"auto"`)
   - Use `"active"` for activity-level indications

## Implementation Checklist

- [ ] All API endpoints define their category constant
- [ ] All responses conform to APIResponse structure
- [ ] All indication types use correct terminology
- [ ] Categories are lowercase with dot notation
- [ ] Redis keys follow naming convention
- [ ] Type definitions in `/lib/types.ts` match categories
- [ ] API types registry is up-to-date
- [ ] All CRUD endpoints return correct category
- [ ] Status endpoints include real-time data
- [ ] Indication config endpoints use correct indication types
