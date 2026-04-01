# SQL to Redis Conversion Guide

## Summary
The system has been migrated from SQL database to Redis-only. All remaining files need conversion from SQL queries to Redis key-value operations.

## Completed Conversions ✅
1. `/app/api/install/download-deployment/route.ts` - Fixed
2. `/app/api/monitoring/alerts/route.ts` - Fixed  
3. `/app/api/system/health-check/route.ts` - Fixed
4. `/app/api/settings/connections/[id]/indications/route.ts` - Fixed
5. `/lib/trade-engine.ts` - Removed unused SQL import

## Remaining Files Requiring Redis Conversion

### Preset Management APIs (13 files)
These files manage trading presets and strategy configurations. They query SQL for preset metadata, configurations, and statistics. Conversion approach:
- Store presets as hash maps in Redis: `preset:{presetId}` containing all metadata
- Use sorted sets for preset listings and filtering: `presets:all`, `presets:active`, etc.
- Store preset configs as nested JSON strings in hash fields

**Files:**
- `app/api/preset-sets/route.ts` - GET (select all), POST (insert)
- `app/api/preset-sets/[id]/route.ts` - GET, PUT, DELETE operations
- `app/api/preset-types/[id]/statistics/route.ts` - Count and aggregate queries
- `app/api/presets/[id]/route.ts` - GET, PUT, DELETE operations
- `app/api/presets/[id]/active-configs/route.ts` - Query active configurations
- `app/api/presets/[id]/strategies/route.ts` - Query strategy list
- `app/api/presets/[id]/symbol-performance/route.ts` - Calculate performance stats
- `app/api/presets/[id]/test/route.ts` - Store test results
- `app/api/presets/init-predefined/route.ts` - Initialize default presets
- `app/api/settings/connections/[id]/preset-type/route.ts` - Link presets to connections
- `app/api/settings/connections/[id]/strategies/route.ts` - Query connection strategies
- `app/api/settings/indications/active-advanced/route.ts` - Query active indications

### Indication/Signal Management (2 files)
- `app/api/settings/connections/[id]/active-indications/route.ts` - Already partially fixed
- Redis pattern: `indications:{connectionId}` as set of indication IDs, `indication:{id}` as hash

### Connection-Related APIs (6 files)
- `app/api/settings/connections/[id]/capabilities/route.ts` - Query connection capabilities
- `app/api/settings/connections/[id]/dashboard/route.ts` - Query dashboard-active connections
- `app/api/settings/connections/[id]/logs/route.ts` - Query connection logs
- `app/api/settings/connections/init-predefined/route.ts` - Initialize predefined connections
- `app/api/trade-engine/emergency-stop/route.ts` - Stop all running engines

### Core Trading Engine Libraries (18 files)
These are complex libraries with SQL dependencies for state management and statistics:

**Trade Engine Core:**
- `lib/trade-engine/engine-manager.ts` - Query engine state
- `lib/trade-engine/pseudo-position-manager.ts` - Query pseudo positions
- `lib/trade-engine/realtime-processor.ts` - Process real-time data

**Strategy/Indication Processing:**
- `lib/auto-indication-engine.ts` - Process indications
- `lib/indication-state-manager.ts` - Manage indication state
- `lib/preset-coordination-engine.ts` - Coordinate presets
- `lib/preset-pseudo-position-manager.ts` - Manage pseudo positions
- `lib/preset-set-evaluator.ts` - Evaluate preset sets
- `lib/preset-tester.ts` - Test presets

**Data Management:**
- `lib/adjust-strategy-statistics.ts` - Calculate strategy statistics
- `lib/backtest-engine.ts` - Run backtests
- `lib/base-pseudo-position-manager.ts` - Manage positions
- `lib/data-sync-manager.ts` - Sync market data
- `lib/exchange-position-manager.ts` - Manage exchange positions
- `lib/position-flow-coordinator.ts` - Coordinate position flows
- `lib/preset-set-evaluator.ts` - Evaluate performance
- `lib/volume-calculator.ts` - Calculate volumes

**Real-time Systems:**
- `lib/realtime/market-data-stream.ts` - Stream market data

## Redis Key Naming Conventions

### Presets
- `preset:{presetId}` - Hash with all preset metadata
- `presets:all` - Set of all preset IDs
- `presets:active` - Set of active preset IDs
- `preset:{presetId}:config` - String with JSON config
- `preset:{presetId}:stats` - Hash with statistics

### Connections
- `connection:{connectionId}` - Already implemented
- `connections` - Set of all connection IDs

### Positions
- `position:{positionId}` - Hash with position data
- `positions:{connectionId}` - Set of positions for connection
- `positions:open` - Set of open position IDs

### Orders
- `order:{orderId}` - Hash with order data
- `orders:{connectionId}` - Set of orders for connection
- `orders:pending` - Set of pending order IDs

### Indications
- `indication:{indicationId}` - Hash with indication data
- `indications:{connectionId}` - Set of indication IDs for connection
- `indications:active` - Set of active indication IDs

## Conversion Pattern

### From SQL to Redis:
```typescript
// OLD - SQL
const result = await sql`SELECT * FROM presets WHERE connection_id = ${id}`

// NEW - Redis
const presetIds = await client.smembers(`presets:connection:${id}`)
const presets = await Promise.all(
  presetIds.map(id => client.hgetall(`preset:${id}`))
)
```

## Performance Considerations
1. **Pagination** - Use ZRANGE with scores for sorted/paginated results
2. **Caching** - Use Redis caching naturally instead of query results
3. **TTL** - Set expiration for temporary data like backtests
4. **Transactions** - Use MULTI/EXEC for atomic operations

## Testing Strategy
1. Verify each endpoint returns same data structure as before
2. Test edge cases (empty results, missing keys)
3. Monitor Redis memory usage
4. Validate performance is acceptable

## Priority Order
1. Connection-related APIs (simplest)
2. Indication/Signal management
3. Preset management
4. Trade engine core systems
5. Complex analytics/statistics libraries
