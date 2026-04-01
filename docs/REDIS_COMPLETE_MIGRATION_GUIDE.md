# Complete Redis Migration Guide

## Critical SQL Issues Fixed ✓

### Trade Engine Core (3 files fixed)
1. **`lib/trade-engine/engine-manager.ts`** ✓
   - Removed: `import { sql } from "@/lib/db"`
   - Fixed: `loadPrehistoricData()` - Now uses Redis `getSettings()/setSettings()`
   - Fixed: `loadMarketDataRange()` - Now uses Redis cache keys
   - Pattern: `await sql` → `await getSettings()/setSettings()`

2. **`lib/trade-engine/realtime-processor.ts`** ✓
   - Removed: `import { sql } from "@/lib/db"`
   - Fixed: `processRealtimeUpdates()` - Updates Redis instead of SQL
   - Pattern: `await sql`UPDATE`` → `await setSettings()`

3. **`lib/indication-state-manager.ts`** ✓
   - Removed: `import { sql } from "@/lib/db"`
   - Fixed: `loadSettings()` - Loads from Redis settings key
   - Pattern: `await sql`SELECT`` → `await getSettings()`

## Remaining Files Requiring Conversion (18 files)

### High Priority (Core Trade Engine)
- `lib/auto-indication-engine.ts` - SQL queries on indications table
- `lib/backtest-engine.ts` - SQL queries for historical data
- `lib/preset-set-evaluator.ts` - SQL queries on preset_sets table
- `lib/preset-tester.ts` - SQL queries on test_results table
- `lib/position-flow-coordinator.ts` - SQL queries on positions/indications
- `lib/preset-coordination-engine.ts` - SQL position coordination queries

### Medium Priority (Data Management)
- `lib/exchange-position-manager.ts` - Position tracking via SQL
- `lib/base-pseudo-position-manager.ts` - Position state management
- `lib/preset-pseudo-position-manager.ts` - Preset position SQL queries
- `lib/indication-processor.ts` - Indication calculation queries
- `lib/strategy-processor.ts` - Strategy execution queries
- `lib/data-sync-manager.ts` - Data synchronization queries

### Low Priority (Utilities & Analytics)
- `lib/adjust-strategy-statistics.ts` - Statistics calculation
- `lib/volume-calculator.ts` - Volume tracking
- `lib/realtime/market-data-stream.ts` - Market data caching
- Trade engine route handlers (5+ files)

## Redis Key Naming Convention for Remaining Conversions

### Data Structures
```
positions:{connectionId}               # Array of positions
positions:{connectionId}:{positionId}  # Individual position
indications:{connectionId}             # Array of indications
indications:{connectionId}:{symbolId}  # Symbol-specific indications
preset_sets:{connectionId}             # Preset sets array
preset_test_results:{testId}          # Test result data
market_data:{connectionId}:{symbol}   # Historical OHLCV data
```

### Conversion Patterns

**FROM:** `SELECT * FROM positions WHERE connection_id = '123'`
**TO:** `const positions = await getSettings('positions:123') || []`

**FROM:** `UPDATE positions SET status = 'closed' WHERE id = '456'`
**TO:** `const positions = await getSettings('positions:123') || []; const pos = positions.find(p => p.id === '456'); if(pos) pos.status = 'closed'; await setSettings('positions:123', positions)`

**FROM:** `INSERT INTO indications VALUES (...)`
**TO:** `const indications = await getSettings('indications:123') || []; indications.push(newIndication); await setSettings('indications:123', indications)`

## Testing Strategy

1. **Unit Tests** - Verify each conversion works in isolation
2. **Integration Tests** - Verify converted code works with Redis
3. **Migration Tests** - Verify migration script preserves data
4. **Smoke Tests** - Verify system starts and runs without errors

## Migration Execution

1. Run `node scripts/migrate-to-redis.js` to initialize Redis data
2. Deploy changes to production
3. Monitor logs for Redis connection errors
4. Verify all orders, positions, and settings loaded correctly
5. Remove all `@/lib/db` imports from codebase

## Performance Considerations

- Redis queries much faster than SQL for simple key-value operations
- Use array filtering in JS instead of SQL WHERE clauses
- Implement caching for frequently accessed data
- Consider Redis expiration for time-sensitive data (TTL)
- Use pipeline commands for bulk operations
