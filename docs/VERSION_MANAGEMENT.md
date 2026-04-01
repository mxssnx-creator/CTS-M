# System Version Management

## Version Format

The system uses semantic versioning with date components:
```
YYYY.MM.DD.vN.mN
```

Where:
- `YYYY.MM.DD` = Release date (e.g., 2026.02.26)
- `vN` = Major version (significant architectural changes)
- `mN` = Minor version (incremented on every merge/deployment)

**Current Version**: 2026.02.26.v4.5

## When to Increment

### Minor Version (`.5` → `.6`)
- **On every merge** to main/production
- When any component or API receives code changes
- Ensures browser cache clears automatically
- Safe to increment without affecting functionality

### Major Version (`.v4` → `.v5`)
- Only for significant architectural changes
- Breaking changes to core systems
- Major refactoring of engine/indication/strategy logic
- Database schema migrations

## Component Versioning

Each UI component has its own version in `COMPONENT_VERSIONS`:

```typescript
export const COMPONENT_VERSIONS = {
  dashboardManager: "v5",      // Tracks dashboard active connections manager
  statisticsOverview: "v4",    // Tracks statistics widget
  systemInitializer: "v3",     // Tracks system boot
  // ... more components
}
```

**When to increment**: When that specific component's logic changes

## API Versioning

Each API endpoint has its own version in `API_VERSIONS`:

```typescript
export const API_VERSIONS = {
  connections: "v4",           // Tracks /api/settings/connections
  tradeEngine: "v2",           // Tracks trade engine APIs
  systemStats: "v3",           // Tracks system statistics
  // ... more APIs
}
```

**When to increment**: When that specific API's logic or response format changes

## Browser Cache Busting

The system automatically clears browser cache through:

1. **Version Headers**: All API requests include `X-API-Version` header
2. **Cache-Bust Query Parameters**: API calls include `v=VERSION&t=TIMESTAMP`
3. **Cache-Control Headers**: All API responses set `Cache-Control: no-store, no-cache`
4. **Version Logging**: Browser logs show which version is running

When major cache issues occur, simply increment the minor version and redeploy.

## Merge Checklist

Before merging to production:

- [ ] Increment `SYSTEM_VERSION` minor version (e.g., `.v4.5` → `.v4.6`)
- [ ] Update component versions if their code changed
- [ ] Update API versions if their logic changed
- [ ] Add entry to `changelog` object in `getSystemVersionInfo()`
- [ ] Run full system initialization test
- [ ] Verify version logs appear in browser console
- [ ] Check that all 6 base exchanges (bybit, bingx, binance, okx, pionex, orangex) are available
- [ ] Confirm only bybit and bingx show in active connections dashboard initially
- [ ] Test adding a connection to active dashboard

## Deployment Notes

When versions are incremented:
- Old browser tabs automatically refresh due to version mismatch
- API responses include version info for debugging
- System logs show version on every request
- Version mismatch warnings appear in console if detected

This ensures no stale cached code causes confusing behavior.

## Current System State (v4.5)

### Component Changes
- **dashboardManager**: Fixed to use ONLY `is_dashboard_inserted` field
- **statisticsOverview**: Now correctly separates indications from strategies
- **systemInitializer**: Comprehensive version logging on startup

### API Changes  
- **connections API**: Added version tracking and cache-bust headers
- **indications**: Separated from strategies (direction/move/active/optimal types)
- **strategies**: Fixed base/main/real/live type categorization

### Known Issues Resolved
- Browser cache showing old code at line 111 of dashboard-active-connections-manager
- All base exchanges showing as added when only bybit/bingx should show
- Mixing of indication types and strategy types in statistics overview
