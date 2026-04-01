# System-Wide Connection and Engine Startup Fixes

## Issues Fixed

### 1. Pionex & OrangeX Being Reassigned as Base Connections ✓
**Before:** Migrations 015 & 016 added all 4 exchanges (bybit, bingx, pionex, orangex) to baseExchangeIds
```typescript
const baseExchangeIds = ["bybit-x03", "bingx-x01", "pionex-x01", "orangex-x01"]  // WRONG
```

**After:** Only bybit and bingx are base connections
```typescript
const baseExchangeIds = ["bybit-x03", "bingx-x01"]  // CORRECT
```

### 2. Engines Not Starting (Found 0 Eligible Connections) ✓
**Root Cause:** Auto-start filter used `is_enabled_dashboard` (user UI toggle) which was 0 for all connections

**Before:**
```typescript
const isDashboardEnabled = c.is_enabled_dashboard === "1"
return isActiveInserted && isDashboardEnabled && hasValidKey  // Always false!
```

**After:**
```typescript
const isSystemEnabled = c.is_enabled === "1"  // Use internal system state
return isActiveInserted && isSystemEnabled && hasValidKey  // Now works!
```

### 3. Database Not Growing (0 keys added) ✓
**Root Cause:** With 0 eligible connections, no engines started, no operations ran
**Fix:** By enabling engine auto-start with proper filter, database operations now proceed

### 4. Added Cleanup Migration 017 ✓
Migration 017 ensures:
- Only bybit-x03 and bingx-x01 are base connections (inserted=1, enabled=1)
- All others reset to template-only state (inserted=0, enabled=0)
- Prevents pioneers/orangex from auto-reassigning

## Files Modified

1. **lib/redis-migrations.ts**
   - Line 470: Fixed Migration 015 baseExchangeIds to only include bybit & bingx
   - Line 524: Fixed Migration 016 baseTemplateIds to only include bybit & bingx
   - Lines 582-637: Added new Migration 017 cleanup migration

2. **lib/trade-engine-auto-start.ts**
   - Line 55: Changed filter to use `is_enabled` instead of `is_enabled_dashboard`
   - Line 59: Renamed variable to `isSystemEnabled` for clarity
   - Line 64: Updated log message to reflect correct filter

## System State After Fixes

| Property | Bybit | BingX | Pionex | OrangeX | Others |
|----------|-------|-------|--------|---------|--------|
| is_inserted | 1 | 1 | 0 | 0 | 0 |
| is_enabled | 1 | 1 | 0 | 0 | 0 |
| is_active_inserted | 1 | 1 | 0 | 0 | 0 |
| is_enabled_dashboard | 0 | 0 | 0 | 0 | 0 |

## Expected Results

✓ Auto-start finds 2 eligible connections (bybit + bingx with valid keys)
✓ Trade engines start automatically
✓ Database keys grow as engines operate
✓ Removing connection doesn't auto-reassign it
✓ System state (is_enabled) independent from UI state (is_enabled_dashboard)

## Testing Checklist

- [ ] Migrations run without errors
- [ ] Debug logs show "Found 2 eligible connections"
- [ ] Trade engines auto-start
- [ ] Database keys increment in Redis
- [ ] Manual connection removal doesn't trigger reassignment
