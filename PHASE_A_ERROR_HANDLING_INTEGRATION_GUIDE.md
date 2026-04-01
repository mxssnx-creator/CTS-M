# Phase A Error Handling Integration Guide

This guide explains how to integrate the Phase A error handling infrastructure into existing code.

## Core Components

### 1. Error Handling Foundation (lib/error-handling-production.ts)
- **Purpose**: Global error handler for unhandled rejections and exceptions
- **Initialization**: Automatically called in instrumentation.ts
- **Usage**: ProductionErrorHandler.logError() for manual logging

### 2. Async Safety Wrapper (lib/async-safety.ts)
- **Purpose**: Wrap async operations with retry, timeout, fallback logic
- **Key Functions**:
  - `safeAsync()` - Retry with timeout
  - `safeSilent()` - Returns null on error
  - `retryAsync()` - Simple retry
  - `withTimeout()` - Timeout protection
  - `AsyncQueue` - Sequential processing

### 3. Circuit Breaker (lib/circuit-breaker.ts)
- **Purpose**: Prevent cascading failures when services fail
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED
- **Usage**: Auto-activated in error-handling-integration.ts

### 4. Error Handling Integration (lib/error-handling-integration.ts)
- **Purpose**: Central point for wrapping operations with error handling + circuit breakers
- **Circuit Breakers Available**:
  - `circuitBreakers.exchange` - Exchange API calls
  - `circuitBreakers.database` - Database operations
  - `circuitBreakers.cache` - Cache operations
  - `circuitBreakers.indication` - Indication processor
  - `circuitBreakers.strategy` - Strategy processor
  - `circuitBreakers.realtime` - Realtime processor

### 5. API Error Middleware (lib/api-error-middleware.ts)
- **Purpose**: Unified error handling for API routes
- **Features**:
  - Rate limiting
  - Correlation tracking
  - Metrics collection
  - Standardized error responses

## Integration Steps

### Step 1: API Routes

**Before:**
```typescript
export async function GET() {
  const data = await database.getConnections()
  return NextResponse.json(data)
}
```

**After:**
```typescript
import { withApiErrorHandling, createJsonResponse, createErrorResponse } from '@/lib/api-error-middleware'
import { withDatabaseErrorHandling } from '@/lib/error-handling-integration'

const handler = async (req: NextRequest) => {
  const data = await withDatabaseErrorHandling(
    () => database.getConnections(),
    'getConnections'
  )
  
  if (!data) {
    return createErrorResponse(new Error('Failed to load connections'), 500)
  }
  
  return createJsonResponse(data)
}

export const GET = withApiErrorHandling(handler, {
  rateLimit: true,
  correlationTracking: true,
  metrics: true
})
```

### Step 2: Exchange API Calls

**Before:**
```typescript
async function getMarketData(connectionId: string) {
  const data = await exchange.getMarketData()
  return data
}
```

**After:**
```typescript
import { withExchangeErrorHandling } from '@/lib/error-handling-integration'

async function getMarketData(connectionId: string) {
  const data = await withExchangeErrorHandling(
    () => exchange.getMarketData(),
    'getMarketData'
  )
  
  if (!data) {
    console.warn('Market data fetch failed, using cached data')
    return getCachedMarketData(connectionId)
  }
  
  return data
}
```

### Step 3: Processors (Indication, Strategy, Realtime)

**Before:**
```typescript
export class IndicationProcessor {
  async process(connectionId: string) {
    const data = await this.fetchData(connectionId)
    const results = this.evaluate(data)
    await this.saveResults(results)
    return results
  }
}
```

**After:**
```typescript
import { withIndicationErrorHandling } from '@/lib/error-handling-integration'

export class IndicationProcessor {
  async process(connectionId: string) {
    const results = await withIndicationErrorHandling(
      async () => {
        const data = await this.fetchData(connectionId)
        const evaluated = this.evaluate(data)
        await this.saveResults(evaluated)
        return evaluated
      },
      'processIndications'
    )
    
    if (!results) {
      console.error('Indication processing failed')
      return null
    }
    
    return results
  }
}
```

### Step 4: Batch Operations

**Before:**
```typescript
async function processConnections(connections: Connection[]) {
  const results = []
  for (const conn of connections) {
    const result = await processConnection(conn) // Fails if any fails
    results.push(result)
  }
  return results
}
```

**After:**
```typescript
import { batchWithErrorHandling } from '@/lib/error-handling-integration'

async function processConnections(connections: Connection[]) {
  const { results, errors } = await batchWithErrorHandling(
    connections,
    (conn) => processConnection(conn),
    {
      batchName: 'processConnections',
      continueOnError: true,
      maxConcurrency: 5
    }
  )
  
  if (errors.length > 0) {
    console.error(`${errors.length} connections failed`)
  }
  
  return { successful: results, failed: errors }
}
```

### Step 5: Retry with Exponential Backoff

**Before:**
```typescript
async function loadConnections() {
  return await db.getAllConnections() // Single attempt
}
```

**After:**
```typescript
import { retryWithBackoff } from '@/lib/error-handling-integration'

async function loadConnections() {
  return await retryWithBackoff(
    () => db.getAllConnections(),
    {
      operationName: 'loadConnections',
      maxAttempts: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2
    }
  ) || []
}
```

## Priority Integration Areas

### Priority 1 - IMMEDIATE (Critical Path)
1. **Trade Engine Core Loop**
   - `/lib/trade-engine.ts` - Main engine start/stop
   - `/lib/trade-engine/engine-manager.ts` - Engine cycle processing
   - Processors: indication, strategy, realtime

2. **Exchange Connectors**
   - `/lib/exchange-connectors/*.ts` - All API calls
   - `getMarketData()`, `getTrades()`, `getPositions()`

3. **API Routes - Trade Engine**
   - `/app/api/trade-engine/*.ts` - All trade engine endpoints
   - `/app/api/connections/*.ts` - Connection management
   - `/app/api/settings/*.ts` - Settings persistence

4. **Database Operations**
   - `/lib/redis-db.ts` - All Redis operations
   - Wrap `get()`, `set()`, `delete()`, `hgetall()`, etc.

### Priority 2 - IMPORTANT (Next)
1. **Connection Manager** - `/lib/connection-manager-v2.ts`
2. **Position Manager** - `/lib/position-manager.ts`
3. **Progress Tracking** - `/lib/progression-state-manager.ts`
4. **Settings** - Settings load/save operations

### Priority 3 - NICE TO HAVE (Later)
1. Utility functions
2. Analytics operations
3. Logging operations

## Metrics Available

After integration, these metrics will be collected:

### Error Metrics
- `errors_total` - Total errors by type and operation
- `http_requests_total` - API requests by method and status
- `http_request_duration_seconds` - Request latency
- `rate_limit_exceeded_total` - Rate limit violations
- `circuit_breaker_state` - Circuit breaker states
- `retry_exhausted_total` - Retry exhaustion events

### Processor Metrics
- `indication_processor_errors_total`
- `strategy_processor_errors_total`
- `realtime_processor_errors_total`
- `batch_operation_errors_total`
- `batch_item_errors_total`

## Monitoring & Alerts

### Health Endpoints
- `GET /api/health` - Full health report
- `GET /api/health/readiness` - Kubernetes readiness probe
- `GET /api/health/liveness` - Kubernetes liveness probe
- `GET /api/metrics` - Prometheus format metrics
- `GET /api/alerts` - Alert history

### Circuit Breaker Status
```typescript
import { getCircuitBreakerStatus } from '@/lib/error-handling-integration'

const status = getCircuitBreakerStatus()
// Returns state for each service: exchange, database, cache, etc.
```

## Testing Error Paths

To verify error handling works:

```typescript
// Test 1: Timeout
await withTimeout(slowOperation(60000), 5000) // Should timeout

// Test 2: Retry
await retryWithBackoff(flakeyOperation(), { maxAttempts: 3 })

// Test 3: Circuit Breaker
for (let i = 0; i < 6; i++) {
  await circuitBreakers.exchange.execute(() => failingOperation())
}
// Circuit should be OPEN after 5 failures

// Test 4: Batch Error Collection
const { results, errors } = await batchWithErrorHandling(
  items,
  async (item) => { if (item.id === 2) throw new Error('Test'); }
)
// Should collect errors and continue
```

## Best Practices

1. **Always use error wrapper** - Don't call risky operations directly
2. **Provide fallback values** - Return null or cached data on error
3. **Log with context** - Include operation name, correlation ID, duration
4. **Monitor metrics** - Track error rates, retry counts, circuit breaker states
5. **Test error paths** - Verify graceful degradation works
6. **Use appropriate timeouts** - Not too short (false negatives), not too long (slow failures)
7. **Set retry attempts** - 2-3 for transient errors, 0 for permanent errors
8. **Configure circuit breakers** - Tune failure thresholds for each service

## Rollout Strategy

### Phase 1 (Week 1)
- Integrate error handling in /api/health endpoints
- Verify metrics are collected
- Test circuit breakers work

### Phase 2 (Week 2)
- Integrate in trade engine core
- Integrate in exchange connectors
- Monitor error rates and recovery

### Phase 3 (Week 3)
- Integrate in connection manager
- Integrate in position manager
- Integrate in all remaining API routes

### Phase 4 (Week 4)
- Performance tuning
- Load testing with injected errors
- Documentation and team training

## Support

For questions or issues with error handling integration:
1. Check error logs: `[ERROR_HANDLER]`, `[CIRCUIT_BREAKER]`, `[RETRY]` prefixes
2. Review metrics: `/api/metrics` endpoint
3. Check health: `/api/health` endpoint
4. View alerts: `/api/alerts` endpoint
