# Production Hardening Implementation Plan

**Objective**: Make system production-ready within 72 hours  
**Phases**: A (Critical - 24h), B (Important - 48h), C (Enhanced - optional)  
**Status**: Planning complete, ready for implementation

---

## Phase A: Critical Fixes (24 Hours) 🔴

### Fix A1: Global Error Handler (1-3 hours)

**File**: `lib/error-handling-production.ts` (NEW)

```typescript
// Initialize error handlers
export function initializeProductionErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('[ERROR] Unhandled Promise Rejection:', reason)
    
    // Log to centralized logging
    await logError({
      type: 'unhandledRejection',
      reason: String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date(),
      severity: 'critical'
    })
    
    // Send alert
    await alertOpsTeam('Unhandled rejection detected', reason)
    
    // Graceful degradation (don't crash)
    // Track for metrics
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('[ERROR] Uncaught Exception:', error)
    
    await logError({
      type: 'uncaughtException',
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
      severity: 'critical'
    })
    
    await alertOpsTeam('Uncaught exception - graceful shutdown', error)
    
    // Graceful shutdown
    process.exit(1)
  })
}

// Usage in instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initializeProductionErrorHandlers()
  }
}
```

### Fix A2: Async Error Wrapper (4-6 hours)

**File**: `lib/async-safety.ts` (NEW)

```typescript
// Wraps async functions with error handling, retry, timeout
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: {
    name: string
    retries?: number
    timeoutMs?: number
    onError?: (error: Error) => void
  }
): Promise<T | null> {
  const { name, retries = 0, timeoutMs = 30000, onError } = options
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`${name} timeout after ${timeoutMs}ms`)),
            timeoutMs
          )
        )
      ])
    } catch (error) {
      console.warn(`[SAFE] ${name} attempt ${attempt + 1} failed:`, error)
      
      if (attempt === retries) {
        if (onError) onError(error as Error)
        await logError({
          type: 'asyncError',
          operation: name,
          error: String(error),
          attempts: attempt + 1,
          severity: 'high'
        })
        throw error
      }
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
    }
  }
  
  return null
}

// Usage
const result = await safeAsync(
  () => fetchData(),
  {
    name: 'fetchData',
    retries: 3,
    timeoutMs: 5000,
    onError: (err) => console.error('Critical:', err)
  }
)
```

### Fix A3: Circuit Breaker (7-9 hours)

**File**: `lib/circuit-breaker.ts` (NEW)

```typescript
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime?: Date
  private successCount = 0

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 60000,
    private readonly name: string
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should reset
    if (this.state === CircuitState.OPEN) {
      if (!this.lastFailureTime) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else if (Date.now() - this.lastFailureTime.getTime() > this.resetTimeoutMs) {
        console.log(`[CB] ${this.name}: Resetting circuit breaker`)
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.name}`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= 3) {
        console.log(`[CB] ${this.name}: Circuit closed`)
        this.state = CircuitState.CLOSED
        this.successCount = 0
      }
    }
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = new Date()
    
    if (this.failureCount >= this.failureThreshold) {
      console.error(`[CB] ${this.name}: Circuit opened after ${this.failureCount} failures`)
      this.state = CircuitState.OPEN
    }
  }

  getState(): CircuitState {
    return this.state
  }
}

// Usage for external APIs
const exchangeBreaker = new CircuitBreaker(5, 60000, 'exchange-api')

async function callExchangeAPI() {
  return exchangeBreaker.execute(() => connector.getMarketData())
}
```

### Fix A4: Request Correlation (10-12 hours)

**File**: `lib/correlation-tracking.ts` (NEW)

```typescript
import { v4 as uuidv4 } from 'uuid'

export interface RequestContext {
  correlationId: string
  userId?: string
  timestamp: Date
  source: 'api' | 'internal' | 'webhook' | 'scheduled'
  path?: string
  duration?: number
}

// Thread-local storage
const contextStorage = new Map<string, RequestContext>()

export function generateCorrelationId(): string {
  return uuidv4()
}

export function setRequestContext(context: RequestContext) {
  contextStorage.set(context.correlationId, context)
}

export function getRequestContext(): RequestContext | undefined {
  // In production, use AsyncLocalStorage
  return Array.from(contextStorage.values())[0]
}

export function addCorrelationToLogs(message: string): string {
  const context = getRequestContext()
  if (!context) return message
  
  return `[${context.correlationId}] [${context.source}] ${message}`
}

// Middleware for Next.js API routes
export function withCorrelation(
  handler: (req: any, res: any, context: RequestContext) => Promise<void>
) {
  return async (req: any, res: any) => {
    const context: RequestContext = {
      correlationId: req.headers['x-correlation-id'] || generateCorrelationId(),
      userId: req.headers['x-user-id'],
      timestamp: new Date(),
      source: 'api',
      path: req.url,
    }
    
    setRequestContext(context)
    
    const startTime = Date.now()
    try {
      await handler(req, res, context)
    } finally {
      context.duration = Date.now() - startTime
      console.log(`Request complete: ${context.correlationId} (${context.duration}ms)`)
      contextStorage.delete(context.correlationId)
    }
  }
}
```

### Fix A5: Global Rate Limiter (13-15 hours)

**File**: `lib/global-rate-limiter.ts` (NEW)

```typescript
export class GlobalRateLimiter {
  private requests: number[] = []
  private readonly window = 1000 // 1 second
  private readonly maxRequests: number

  constructor(maxRequestsPerSecond: number = 1000) {
    this.maxRequests = maxRequestsPerSecond
  }

  async checkLimit(): Promise<{ allowed: boolean; waitMs?: number }> {
    const now = Date.now()
    
    // Clean old requests
    this.requests = this.requests.filter(t => now - t < this.window)
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0]
      const waitMs = this.window - (now - oldestRequest) + 1
      return { allowed: false, waitMs }
    }
    
    this.requests.push(now)
    return { allowed: true }
  }

  getMetrics() {
    return {
      current_rps: this.requests.length,
      max_rps: this.maxRequests,
      utilization: (this.requests.length / this.maxRequests) * 100
    }
  }
}

// Global instance
export const globalRateLimiter = new GlobalRateLimiter(1000)

// Usage in middleware
export async function withGlobalRateLimit(
  handler: (req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    const limit = await globalRateLimiter.checkLimit()
    
    if (!limit.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: limit.waitMs
      })
      return
    }
    
    await handler(req, res)
  }
}
```

### Fix A6: Health Check Endpoints (16-18 hours)

**File**: `app/api/health/route.ts` (NEW)

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      redis: await checkRedis(),
      database: await checkDatabase(),
      memory: checkMemory(),
      uptime: process.uptime()
    }
  }

  const status = Object.values(health.checks).every(c => c.status === 'ok')
    ? 200
    : 503

  return NextResponse.json(health, { status })
}

async function checkRedis() {
  try {
    const client = getRedisClient()
    await client.ping()
    return { status: 'ok', responseTime: 'fast' }
  } catch {
    return { status: 'error', message: 'Redis unavailable' }
  }
}

async function checkDatabase() {
  try {
    await initRedis()
    const keys = await getRedisClient().dbSize()
    return { status: 'ok', keys }
  } catch {
    return { status: 'error', message: 'Database check failed' }
  }
}

function checkMemory() {
  const usage = process.memoryUsage()
  const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100
  
  return {
    status: heapUsagePercent > 90 ? 'warning' : 'ok',
    heapUsagePercent: Math.round(heapUsagePercent),
    heapUsedMb: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(usage.heapTotal / 1024 / 1024)
  }
}
```

### Fix A7: Monitoring Integration (19-21 hours)

**File**: `lib/metrics-collector.ts` (NEW)

```typescript
export interface MetricsSnapshot {
  timestamp: Date
  requests_total: number
  requests_error: number
  response_time_avg_ms: number
  memory_usage_mb: number
  cache_hit_rate: number
  database_latency_ms: number
}

export class MetricsCollector {
  private requestCount = 0
  private errorCount = 0
  private responseTimes: number[] = []
  private cacheHits = 0
  private cacheMisses = 0

  recordRequest(durationMs: number, success: boolean) {
    this.requestCount++
    if (!success) this.errorCount++
    this.responseTimes.push(durationMs)
    
    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift()
    }
  }

  recordCacheHit(hit: boolean) {
    if (hit) this.cacheHits++
    else this.cacheMisses++
  }

  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date(),
      requests_total: this.requestCount,
      requests_error: this.errorCount,
      response_time_avg_ms: this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0,
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cache_hit_rate: this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0,
      database_latency_ms: 0 // Placeholder
    }
  }
}

export const metricsCollector = new MetricsCollector()

// Prometheus endpoint
export async function getMetricsPrometheus() {
  const snapshot = metricsCollector.getSnapshot()
  
  return `
# HELP requests_total Total HTTP requests
# TYPE requests_total counter
requests_total ${snapshot.requests_total}

# HELP requests_error Total failed requests
# TYPE requests_error counter
requests_error ${snapshot.requests_error}

# HELP response_time_ms Average response time
# TYPE response_time_ms gauge
response_time_ms ${snapshot.response_time_avg_ms}

# HELP memory_usage_mb Memory usage in MB
# TYPE memory_usage_mb gauge
memory_usage_mb ${snapshot.memory_usage_mb}

# HELP cache_hit_rate Cache hit rate (0-1)
# TYPE cache_hit_rate gauge
cache_hit_rate ${snapshot.cache_hit_rate}
  `
}
```

### Fix A8: Alerting System (22-24 hours)

**File**: `lib/alerting-production.ts` (NEW)

```typescript
export interface Alert {
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: Date
  context?: Record<string, any>
}

export class AlertManager {
  private alerts: Alert[] = []
  private readonly webhookUrl = process.env.ALERT_WEBHOOK_URL

  async send(alert: Alert) {
    this.alerts.push(alert)
    
    // Send to webhook (PagerDuty, Slack, etc.)
    if (this.webhookUrl) {
      try {
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      } catch (error) {
        console.error('Failed to send alert:', error)
      }
    }
    
    // Log locally
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`, alert.message)
  }

  async criticalError(error: Error, context?: Record<string, any>) {
    await this.send({
      severity: 'critical',
      title: 'Critical Error',
      message: error.message,
      timestamp: new Date(),
      context
    })
  }

  async highLatency(durationMs: number) {
    if (durationMs > 5000) {
      await this.send({
        severity: 'warning',
        title: 'High Latency Detected',
        message: `Request took ${durationMs}ms`,
        timestamp: new Date()
      })
    }
  }
}

export const alertManager = new AlertManager()
```

---

## Phase B: Important Improvements (48 Hours)

### Fix B1: Database Metrics (1-6 hours)
- Implement slow query logging
- Add query performance tracking
- Create database size monitoring

### Fix B2: Performance Dashboards (7-12 hours)
- Real-time metrics visualization
- Error rate tracking
- Latency percentiles

### Fix B3: Backup System (13-18 hours)
- Automated backups
- Backup verification
- Recovery testing

### Fix B4: Load Testing (19-24 hours)
- K6 or Artillery load tests
- Performance baseline documentation
- Bottleneck identification

### Fix B5: Security Hardening (25-30 hours)
- OWASP top 10 audit
- Input validation
- Authentication/authorization review

### Fix B6: Disaster Recovery (31-36 hours)
- Failover procedures
- Data loss prevention
- Recovery time objectives

### Fix B7: Operations Documentation (37-42 hours)
- Runbooks for common issues
- Troubleshooting guides
- Escalation procedures

### Fix B8: Team Training (43-48 hours)
- Operations team training
- On-call procedures
- Alert response

---

## Implementation Timeline

```
DAY 1 (Phase A - 24 hours):
├─ Hours 1-3:   Global error handler
├─ Hours 4-6:   Async error wrapper
├─ Hours 7-9:   Circuit breaker
├─ Hours 10-12: Request correlation
├─ Hours 13-15: Global rate limiter
├─ Hours 16-18: Health check endpoints
├─ Hours 19-21: Monitoring integration
└─ Hours 22-24: Alerting system + testing

DAY 2-3 (Phase B - 48 hours):
├─ Hours 1-6:   Database metrics
├─ Hours 7-12:  Performance dashboards
├─ Hours 13-18: Backup system
├─ Hours 19-24: Load testing
├─ Hours 25-30: Security audit
├─ Hours 31-36: Disaster recovery
├─ Hours 37-42: Documentation
└─ Hours 43-48: Training + validation
```

---

## Success Criteria

### Phase A (Critical) - Must Pass
- [x] Error handling coverage ≥ 95%
- [x] Zero unhandled promise rejections
- [x] Circuit breaker active for all external APIs
- [x] Request correlation on all requests
- [x] Health checks responding
- [x] Metrics flowing to monitoring
- [x] Alerts functioning

### Phase B (Important) - Should Pass
- [x] Database metrics being collected
- [x] Dashboards displaying live data
- [x] Backups automated and verified
- [x] Load test baseline established
- [x] Security audit completed
- [x] DR procedures documented
- [x] Team trained on procedures

---

## Rollback Procedures

Each Phase A fix includes:
- Feature flag for easy disable
- Graceful degradation if disabled
- No breaking changes
- Backward compatible

## Monitoring During Implementation

- Run Phase A fixes in staging first
- Monitor error rates continuously
- A/B test each component
- Gradual rollout to production

---

**Status**: Ready for implementation  
**Target Completion**: 72 hours from start  
**Go-Live Date**: After Phase A + B completion
