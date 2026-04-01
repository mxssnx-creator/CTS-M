# PHASE 2 IMPLEMENTATION PLAN
## State Consistency Fixes (7 Issues)

**Status**: Ready to implement  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium (straightforward logic fixes)  

---

## Overview

Phase 2 fixes 7 critical state consistency issues that cause the UI to ignore user actions and display incorrect information:

1. **Dashboard toggles ignored** - Disabling a connection doesn't stop the engine
2. **Connection count mismatches** - UI shows different counts than actual state
3. **Engine enablement race conditions** - Concurrent toggles cause state corruption
4. **Quick-start automatic re-enable** - User-disabled engines restart automatically
5. **Main/Base assignment conflicts** - Connections can't cleanly move between states
6. **Progression visibility gaps** - Running engines show as stopped and vice versa
7. **Settings persistence bugs** - Toggle state lost on page refresh

---

## Phase 2 Fix Summary

| # | Issue | File | Complexity | Time |
|---|-------|------|-----------|------|
| 2.1 | Dashboard toggle ignored | `toggle-dashboard/route.ts` | Low | 30min |
| 2.2 | Connection count inconsistencies | New: `connection-count-service.ts` | Medium | 45min |
| 2.3 | Engine enablement race conditions | `trade-engine.ts` | Medium | 45min |
| 2.4 | Quick-start auto re-enable | `quick-start/route.ts` | Low | 30min |
| 2.5 | Assignment conflicts | `toggle-dashboard/route.ts` | Low | 30min |
| 2.6 | Progression visibility | `progression API` | Low | 30min |
| 2.7 | Settings persistence | Various APIs | Low | 30min |

---

## Fix 2.1: Dashboard Toggle Ignored

**Issue**: When user toggles `is_enabled_dashboard` OFF, engine continues running

**Root Cause**:
- Toggle updates database but doesn't stop the running engine
- Engine continues until next global refresh cycle
- User sees toggle OFF but engine still processing data

**Solution**:
```typescript
// File: app/api/settings/connections/[id]/toggle-dashboard/route.ts

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const connectionId = params.id
  const { enabled } = await request.json()
  
  // Update database
  const updatedConn = await updateConnection(connectionId, { 
    is_enabled_dashboard: enabled ? "1" : "0" 
  })
  
  // CRITICAL: Stop engine if disabling
  if (!enabled && updatedConn.is_assigned === "1") {
    const coordinator = getGlobalTradeEngineCoordinator()
    await coordinator.stopEngine(connectionId)
    console.log(`[v0] ✓ Engine stopped for ${connectionId} (dashboard disabled)`)
  }
  
  // Start engine if enabling (only if assigned to main)
  if (enabled && updatedConn.is_assigned === "1") {
    const coordinator = getGlobalTradeEngineCoordinator()
    await coordinator.startEngine(connectionId, { connectionId })
    console.log(`[v0] ✓ Engine started for ${connectionId} (dashboard enabled)`)
  }
  
  return NextResponse.json({ 
    success: true,
    connection: updatedConn,
    engine_action: enabled ? 'started' : 'stopped'
  })
}
```

**Implementation Steps**:
1. Get `getGlobalTradeEngineCoordinator()` from `lib/trade-engine.ts`
2. Add stop call when disabling
3. Add start call when enabling
4. Return action status
5. Log all changes for debugging

**Test Checklist**:
- [ ] Disable toggle → engine stops immediately
- [ ] Enable toggle → engine starts immediately
- [ ] Check logs show engine stop/start
- [ ] Multiple rapid toggles don't crash
- [ ] State persists after refresh

---

## Fix 2.2: Connection Count Inconsistencies

**Issue**: Dashboard shows different counts than actual connection state

**Root Cause**:
- Counts calculated in multiple places with different logic
- No single source of truth
- Cached counts not updated on state changes

**Solution**:

Create new centralized service:
```typescript
// File: lib/connection-count-service.ts

import { getAllConnections } from "@/lib/redis-db"
import { isEngineRunning } from "@/lib/trade-engine"

export async function getConnectionCounts() {
  const allConnections = await getAllConnections()
  
  const baseEnabled = allConnections.filter(c => c.is_enabled === "1")
  const mainAssigned = allConnections.filter(c => c.is_assigned === "1")
  const mainEnabled = mainAssigned.filter(c => c.is_enabled_dashboard === "1")
  
  // Count currently running engines
  const runningIds = await Promise.all(
    mainEnabled.map(c => isEngineRunning(c.id).then(running => running ? c.id : null))
  )
  const processing = runningIds.filter(id => id !== null).length
  
  return {
    base: {
      total: allConnections.length,
      enabled: baseEnabled.length,
      working: baseEnabled.filter(c => c.last_test_status === "success").length,
    },
    main: {
      total: mainAssigned.length,
      enabled: mainEnabled.length,
      processing,
    },
    last_updated: new Date().toISOString(),
  }
}
```

Update API endpoint:
```typescript
// File: app/api/connections/counts/route.ts

import { getConnectionCounts } from "@/lib/connection-count-service"

export async function GET() {
  const counts = await getConnectionCounts()
  return NextResponse.json(counts)
}
```

**Implementation Steps**:
1. Create `lib/connection-count-service.ts`
2. Export `getConnectionCounts()` function
3. Update/create API endpoint at `/api/connections/counts`
4. Update UI components to use single endpoint
5. Cache for 5-10 seconds to avoid excessive calculations

**Files to Update**:
- `components/dashboard/connection-overview.tsx` - Use new endpoint
- `components/dashboard/smart-overview.tsx` - Use new endpoint
- Any other UI showing connection counts

---

## Fix 2.3: Engine Enablement Race Conditions

**Issue**: Concurrent enable/disable toggles cause state corruption

**Root Cause**:
- No synchronization between toggle and engine state
- Multiple toggles in quick succession create race conditions
- Toggle doesn't wait for engine state to stabilize

**Solution** (add to `lib/trade-engine.ts`):
```typescript
class GlobalTradeEngineCoordinator {
  private stoppingEngines = new Set<string>()  // Track stopping engines
  
  async stopEngine(connectionId: string): Promise<void> {
    // Prevent duplicate stop calls
    if (this.stoppingEngines.has(connectionId)) {
      console.log(`[v0] Engine already stopping for ${connectionId}`)
      return
    }
    
    try {
      this.stoppingEngines.add(connectionId)
      
      const manager = this.engineManagers.get(connectionId)
      if (manager) {
        await manager.stop()
        this.engineManagers.delete(connectionId)
      }
      
      // Update state
      await updateEngineState(connectionId, "stopped")
      console.log(`[v0] ✓ Engine stopped for ${connectionId}`)
    } finally {
      this.stoppingEngines.delete(connectionId)
    }
  }
  
  async toggleEngine(connectionId: string, enabled: boolean): Promise<void> {
    // Wait for any ongoing state change
    while (this.startingEngines.has(connectionId) || this.stoppingEngines.has(connectionId)) {
      await new Promise(r => setTimeout(r, 50))
    }
    
    if (enabled) {
      await this.startEngine(connectionId, { connectionId })
    } else {
      await this.stopEngine(connectionId)
    }
  }
}
```

**Implementation Steps**:
1. Add `stoppingEngines` Set to track stopping engines
2. Implement `stopEngine()` method with synchronization
3. Implement `toggleEngine()` method
4. Update toggle-dashboard route to use `toggleEngine()`
5. Add timeouts to prevent infinite waits

---

## Fix 2.4: Quick-Start Auto Re-enable

**Issue**: After user disables an engine, quick-start automatically re-enables it

**Root Cause**:
- Quick-start doesn't check if engine was intentionally disabled
- Auto-enable logic overrides user choice
- No tracking of "user-disabled" state

**Solution** (update `app/api/trade-engine/quick-start/route.ts`):
```typescript
export async function POST() {
  const allConnections = await getAllConnections()
  
  for (const conn of allConnections) {
    // Only start if:
    // 1. Connection is assigned to main (is_assigned === "1")
    // 2. User explicitly enabled it (is_enabled_dashboard === "1")
    // 3. Engine not already running
    
    if (conn.is_assigned === "1" && conn.is_enabled_dashboard === "1") {
      const isRunning = await isEngineRunning(conn.id)
      if (!isRunning) {
        const coordinator = getGlobalTradeEngineCoordinator()
        await coordinator.startEngine(conn.id, { connectionId: conn.id })
      }
    }
  }
  
  return NextResponse.json({ success: true })
}
```

**Key Change**: Remove any logic that auto-sets `is_enabled_dashboard` to "1"

**Implementation Steps**:
1. Review quick-start endpoint
2. Remove any auto-enable logic for `is_enabled_dashboard`
3. Only start engines where BOTH `is_assigned === "1"` AND `is_enabled_dashboard === "1"`
4. Log decisions for debugging

---

## Fix 2.5: Assignment Conflicts

**Issue**: Connections can't move between main/base states cleanly

**Root Cause**:
- Assignment and enablement are entangled
- Disabling base shouldn't affect main assignment
- No clear boundary between states

**Solution** (update `lib/connection-state-utils.ts`):
```typescript
export function isConnectionBaseEnabled(conn: Connection): boolean {
  // Base enabled if BOTH inserted AND enabled in settings
  return conn.is_inserted === "1" && conn.is_enabled === "1"
}

export function isConnectionAssignedToMain(conn: Connection): boolean {
  // Main assigned if explicitly assigned (independent of base)
  return conn.is_assigned === "1"
}

export function isConnectionMainEnabled(conn: Connection): boolean {
  // Main enabled if BOTH assigned AND dashboard-enabled
  return conn.is_assigned === "1" && conn.is_enabled_dashboard === "1"
}

export function isConnectionProcessing(conn: Connection): boolean {
  // Processing if main enabled AND engine running
  return isConnectionMainEnabled(conn)
}
```

**Implementation Steps**:
1. Update or create state utility helpers
2. Update all connection filters to use these helpers
3. Remove entangled state logic
4. Verify independent state handling

---

## Fix 2.6: Progression Visibility

**Issue**: Running engines show as stopped and vice versa

**Root Cause**:
- Progression API checks stale cycle counts
- Doesn't check actual engine running state
- Cache not updated after engine start/stop

**Solution** (update progression API):
```typescript
// File: app/api/connections/progression/[id]/route.ts

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const connectionId = params.id
  
  // Check if engine actually running RIGHT NOW
  const coordinator = getGlobalTradeEngineCoordinator()
  const isRunning = await coordinator.isEngineRunning(connectionId)
  
  // Get progression state
  const progression = await getProgressionState(connectionId)
  
  return NextResponse.json({
    connectionId,
    is_running: isRunning,  // Current reality, not historical
    progression,
    last_updated: new Date().toISOString(),
  })
}
```

**Implementation Steps**:
1. Update progression endpoint to check current engine state
2. Remove reliance on stale cycle counts
3. Add runtime checks for running engines
4. Cache for 1-2 seconds only

---

## Fix 2.7: Settings Persistence

**Issue**: Toggle state lost on page refresh

**Root Cause**:
- Toggle updates Redis but response doesn't confirm
- UI state not synchronized with backend
- No callback to refresh UI state after toggle

**Solution**: Ensure all toggle endpoints return current state:
```typescript
// Pattern for all toggle endpoints

export async function POST(request: Request) {
  // ... update logic ...
  
  // Always return full connection state
  const updatedConnection = await getConnection(connectionId)
  
  return NextResponse.json({
    success: true,
    connection: updatedConnection,  // Full state
    timestamp: new Date().toISOString(),
  })
}
```

**Files to Update**:
- `app/api/settings/connections/[id]/toggle-dashboard/route.ts`
- `app/api/settings/connections/[id]/toggle-base/route.ts` (if exists)
- `app/api/connections/[id]/add-to-active/route.ts`
- `app/api/connections/[id]/remove-from-active/route.ts`

**Implementation Steps**:
1. Ensure all toggle endpoints return full connection state
2. Update UI to refresh from response
3. Add error handling for state mismatches
4. Add retry logic if state doesn't match after update

---

## Testing Checklist

### Test 2.1: Dashboard Toggle
- [ ] Toggle OFF → engine stops immediately
- [ ] Toggle ON → engine starts immediately
- [ ] Rapid toggles don't cause errors
- [ ] Engine state matches UI state after toggle

### Test 2.2: Connection Counts
- [ ] Count endpoint exists at `/api/connections/counts`
- [ ] Base count matches actual base connections
- [ ] Main count matches actual assigned connections
- [ ] Processing count > enabled count (only running engines)
- [ ] Counts update within 10 seconds of connection change

### Test 2.3: Race Conditions
- [ ] 5 rapid enable/disable toggles work correctly
- [ ] Engine state consistent after race
- [ ] No duplicate timers created
- [ ] No errors in logs

### Test 2.4: Quick-Start
- [ ] Quick-start only starts explicitly enabled engines
- [ ] User-disabled engines stay disabled
- [ ] Quick-start respects `is_assigned` and `is_enabled_dashboard`
- [ ] No auto-enable behavior

### Test 2.5: Assignment
- [ ] Can move connection to main without affecting base
- [ ] Can remove from main without affecting base
- [ ] Base settings don't leak into main state
- [ ] Main settings don't leak into base state

### Test 2.6: Progression
- [ ] Progression API shows engine as running immediately after start
- [ ] Progression API shows engine as stopped immediately after stop
- [ ] Progression state matches coordinator state

### Test 2.7: Persistence
- [ ] Toggle → page refresh → state persists
- [ ] Toggle → check API → response has current state
- [ ] Multiple API calls return consistent state

---

## Implementation Order

**Recommended sequence** (to minimize conflicts):

1. **Fix 2.1** - Dashboard toggle (blocking other fixes)
2. **Fix 2.3** - Race conditions (enables reliable state changes)
3. **Fix 2.2** - Connection counts (now based on stable state)
4. **Fix 2.6** - Progression visibility (uses coordinator state)
5. **Fix 2.7** - Settings persistence (applies to all endpoints)
6. **Fix 2.4** - Quick-start (uses updated toggle logic)
7. **Fix 2.5** - Assignment conflicts (validation after other fixes)

---

## Risk Mitigation

- **Risk**: Breaking existing connections → **Mitigation**: Test with 4 base connections first
- **Risk**: Infinite wait loops → **Mitigation**: Add 5s timeout to state wait
- **Risk**: Cache invalidation → **Mitigation**: Short TTL (1-5s) until stable
- **Risk**: Missed engine stops → **Mitigation**: Add cleanup on toggle OFF

---

## Success Criteria

✅ Dashboard toggles respond immediately  
✅ Connection counts accurate and update within 10s  
✅ No race condition errors in logs  
✅ Quick-start respects user settings  
✅ Progression shows real engine state  
✅ All state persists across page refresh  
✅ `bun typecheck` passes  
✅ `bun lint` passes  
✅ No TypeScript errors  

---

## Next Steps After Phase 2

Once Phase 2 is complete:
1. Run comprehensive test suite
2. Commit all changes
3. Update memory bank
4. Begin Phase 3: Database consolidation
5. Begin Phase 4: Architecture improvements
