# Comprehensive Error Handling & Logging Guide

## Overview

This guide covers the complete error handling and logging infrastructure for the CTS v3 Trade Engine, including structured logging, intelligent recovery strategies, and smart UI components for error visualization.

**Status**: ✅ COMPLETE - Fully integrated production-ready system

## 1. Structured Logging System

### Architecture

The structured logging system (`lib/structured-logging.ts`) provides multi-level logging with comprehensive context tracking:

**Log Levels**:
- `DEBUG` (0) - Detailed debugging information
- `INFO` (1) - General informational messages
- `WARN` (2) - Warning messages
- `ERROR` (3) - Error messages
- `CRITICAL` (4) - Critical system failures

**Categories**:
- `SYSTEM` - System-wide events
- `API` - API request/response handling
- `DATABASE` - Database operations
- `EXCHANGE` - Exchange API interactions
- `ENGINE` - Trade engine operations
- `STRATEGY` - Strategy processing
- `INDICATION` - Indication generation
- `REALTIME` - Real-time data processing
- `SECURITY` - Security events
- `PERFORMANCE` - Performance metrics
- `HEALTH` - Health check events
- `BACKUP` - Backup operations
- `ALERT` - Alert events

### Usage Examples

**Basic Logging**:
```typescript
import { getLogger, LogCategory } from '@/lib/structured-logging'

const logger = getLogger(LogCategory.API)

// Info level
logger.info('Request received', { path: '/api/trades', method: 'GET' })

// Warning level
logger.warn('Slow response detected', { duration: 5000 }, error)

// Error level
logger.error('Database connection failed', error, { retries: 3 })

// Critical level
logger.critical('System shutdown initiated', error, { reason: 'memory_full' })
```

**Accessing Logs**:
```typescript
import { getAllLogs, getLogger, LogCategory, LogLevel } from '@/lib/structured-logging'

const logger = getLogger(LogCategory.API)

// Get all logs
const allLogs = getAllLogs()

// Get filtered logs
const errorLogs = logger.getFilteredLogs({
  level: LogLevel.ERROR,
  limit: 100
})

// Export logs
const json = logger.export()
const csv = logger.exportCSV()
```

### Features

✅ **Correlation ID Tracking**: Automatically includes correlation ID in all logs for distributed tracing
✅ **Rich Context**: Attach arbitrary metadata to logs
✅ **Error Details**: Automatic error name, message, stack capture
✅ **Performance Metrics**: Track operation duration, memory usage
✅ **Metrics Integration**: Logs feed into metrics collector for monitoring
✅ **Color-Coded Console**: Terminal output with severity-based colors
✅ **Export Capabilities**: JSON and CSV export for analysis
✅ **Configurable Retention**: Default 10,000 log buffer

## 2. Comprehensive Error Handler

### Architecture

The comprehensive error handler (`lib/comprehensive-error-handler.ts`) provides intelligent error recovery:

**Recovery Strategies**:

1. **RETRY** - Retry with exponential backoff
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.RETRY,
     maxRetries: 3,
     retryDelayMs: 1000
   })
   ```

2. **FALLBACK** - Return safe default value
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.FALLBACK,
     fallbackValue: { status: 'unavailable' }
   })
   ```

3. **CIRCUIT_BREAK** - Stop calling failing service
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.CIRCUIT_BREAK,
     fallbackValue: cachedValue
   })
   ```

4. **CACHE** - Return cached value
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.CACHE,
     fallbackValue: lastKnownGoodValue
   })
   ```

5. **GRACEFUL_DEGRADE** - Continue with reduced functionality
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.GRACEFUL_DEGRADE,
     fallbackValue: simplifiedResponse
   })
   ```

6. **QUEUE** - Defer processing for later
   ```typescript
   const result = await comprehensiveErrorHandler.handleError(error, context, {
     strategy: RecoveryStrategy.QUEUE,
     queueSize: 100
   })
   ```

### Error Context

```typescript
interface ErrorContext {
  operation: string      // Operation name
  service?: string       // Service name
  userId?: string        // User performing operation
  correlationId?: string // Correlation ID (auto-populated)
  metadata?: Record<string, any> // Additional metadata
}
```

### Usage

**Wrap Async Operations**:
```typescript
import { withComprehensiveErrorHandling, RecoveryStrategy } from '@/lib/comprehensive-error-handler'

const result = await withComprehensiveErrorHandling(
  async () => {
    return await fetchTradeData()
  },
  {
    operation: 'fetch_trade_data',
    service: 'exchange_api',
    metadata: { symbol: 'BTCUSD' }
  },
  {
    strategy: RecoveryStrategy.FALLBACK,
    fallbackValue: []
  }
)
```

**Direct Error Handling**:
```typescript
import { comprehensiveErrorHandler, RecoveryStrategy } from '@/lib/comprehensive-error-handler'

try {
  await riskyOperation()
} catch (error) {
  const result = await comprehensiveErrorHandler.handleError(
    error as Error,
    {
      operation: 'risky_operation',
      service: 'critical_service'
    },
    {
      strategy: RecoveryStrategy.RETRY,
      maxRetries: 3,
      retryDelayMs: 500
    }
  )
}
```

### Error Metrics

```typescript
// Get metrics for operation
const metrics = comprehensiveErrorHandler.getMetrics('fetch_trade_data')
// Returns: { errorCount, lastError, consecutiveFailures, recoveryAttempts, successRate }

// Get error history
const errors = comprehensiveErrorHandler.getErrorHistory('fetch_trade_data', 10)

// Get all metrics
const allMetrics = comprehensiveErrorHandler.getAllMetrics()

// Configure error threshold
comprehensiveErrorHandler.setErrorThreshold('fetch_trade_data', 5)

// Reset metrics
comprehensiveErrorHandler.resetMetrics('fetch_trade_data')
```

## 3. Logging API Endpoint

### Endpoint: `GET /api/logs`

Retrieve structured logs with advanced filtering.

**Query Parameters**:
- `level` - Filter by log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
- `category` - Filter by category (SYSTEM, API, DATABASE, etc.)
- `correlationId` - Filter by correlation ID
- `limit` - Maximum logs to return (default: 100)
- `format` - Response format (json or csv, default: json)

**Examples**:
```bash
# Get last 100 ERROR logs
curl "http://localhost:3001/api/logs?level=ERROR&limit=100"

# Get API category logs
curl "http://localhost:3001/api/logs?category=API&limit=50"

# Get logs by correlation ID
curl "http://localhost:3001/api/logs?correlationId=abc-123-def"

# Export as CSV
curl "http://localhost:3001/api/logs?format=csv" > logs.csv
```

**Response**:
```json
{
  "success": true,
  "count": 25,
  "logs": [
    {
      "timestamp": "2026-03-23T15:30:45.123Z",
      "correlationId": "abc-123-def",
      "level": "ERROR",
      "category": "API",
      "message": "Request failed",
      "context": { "path": "/api/trades" },
      "error": {
        "name": "ConnectionError",
        "message": "Connection timeout",
        "stack": "..."
      },
      "metrics": { "duration": 5000 }
    }
  ],
  "correlationId": "xyz-789-uvw"
}
```

### Endpoint: `POST /api/logs`

Export or clear logs.

**Request Body**:
```json
{
  "action": "export",
  "format": "json"
}
```

**Actions**:
- `export` - Export all logs in specified format
- `clear` - Clear all logs

## 4. Expandable Error Panel UI Component

### Component: `ExpandableErrorPanel`

Smart, detailed UI for displaying and interacting with error logs.

**Features**:
- ✅ Expandable/collapsible log entries
- ✅ Color-coded severity levels
- ✅ Search and filtering
- ✅ Copy to clipboard
- ✅ JSON export
- ✅ Error detail visualization
- ✅ Stack trace expansion
- ✅ Performance metrics display
- ✅ Responsive design

### Usage

```typescript
'use client'

import { ExpandableErrorPanel } from '@/components/ui/expandable-error-panel'
import { useState, useEffect } from 'react'

export default function LogsPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const fetchLogs = async () => {
      const response = await fetch('/api/logs?limit=100')
      const data = await response.json()
      setLogs(data.logs)
    }
    
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    const response = await fetch('/api/logs?limit=100')
    const data = await response.json()
    setLogs(data.logs)
  }

  return (
    <div className="p-6">
      <ExpandableErrorPanel
        logs={logs}
        title="System Logs"
        description="View detailed system logs with filtering"
        onRefresh={handleRefresh}
        filterByLevel="ERROR"
      />
    </div>
  )
}
```

## 5. Integration Across API Routes

### Best Practices

**1. All API Routes Should Use Comprehensive Error Handling**:
```typescript
import { withApiErrorHandling } from '@/lib/api-error-middleware'

export const POST = withApiErrorHandling(
  async (req) => {
    // Route logic
  },
  {
    requireAuth: true,
    rateLimit: true,
    correlationTracking: true,
    metrics: true
  }
)
```

**2. Log Important Operations**:
```typescript
import { getLogger, LogCategory } from '@/lib/structured-logging'

const logger = getLogger(LogCategory.API)

logger.info('Processing trade request', {
  symbol: req.body.symbol,
  quantity: req.body.quantity
})
```

**3. Handle Errors with Recovery Strategy**:
```typescript
import { withComprehensiveErrorHandling, RecoveryStrategy } from '@/lib/comprehensive-error-handler'

const result = await withComprehensiveErrorHandling(
  async () => { /* operation */ },
  { operation: 'place_trade', service: 'exchange' },
  { strategy: RecoveryStrategy.RETRY, maxRetries: 3 }
)
```

## 6. Monitoring & Alerting

### Metrics

All errors and logs generate metrics:

```
log_events_total - Total logs by level and category
error_logs_total - Total error/critical logs
error_handled_total - Total handled errors
error_retry_attempted - Retry attempts
error_fallback_used - Fallback activations
error_circuit_breaker_open - Circuit breaker openings
operation_success_rate - Operation success percentage
```

### Alerts

Critical errors trigger alerts:

```typescript
// Critical keywords that trigger alerts:
- 'database'
- 'connection'
- 'auth'
- 'security'
- 'critical'

// Alert example:
{
  title: 'Database Connection Failed',
  message: 'Error: Connection timeout after 5 seconds',
  severity: 'CRITICAL',
  source: 'error-handler'
}
```

## 7. Troubleshooting

### High Error Logs

**Check**:
```bash
# Check error rate
curl "http://localhost:3001/api/logs?level=ERROR&limit=50"

# Check critical errors
curl "http://localhost:3001/api/logs?level=CRITICAL"

# Check specific category
curl "http://localhost:3001/api/logs?category=DATABASE"
```

**Solutions**:
1. Check service health endpoints
2. Review circuit breaker status
3. Check database connectivity
4. Monitor memory usage

### Slow Operations

**Check**:
```bash
# Filter by operation duration metrics
curl "http://localhost:3001/api/logs?category=PERFORMANCE"
```

### Memory Leaks

**Identify**:
```typescript
const logger = getLogger(LogCategory.SYSTEM)
const logs = logger.getBuffer()

// Check for growing context sizes
const memoryLogs = logs.filter(l => l.metrics?.memoryAfter)
```

## 8. Best Practices

1. **Always Include Context**: Add relevant metadata to logs
   ```typescript
   logger.info('Operation completed', { userId: user.id, duration: ms })
   ```

2. **Use Appropriate Levels**: Don't overuse ERROR level
   ```typescript
   logger.info('Expected case handled')  // Don't use ERROR
   logger.warn('Degraded performance')   // Use WARN
   ```

3. **Correlation IDs**: Include in error responses
   ```typescript
   return NextResponse.json({ error: 'Failed' }, {
     headers: { 'X-Correlation-Id': getCorrelationId() }
   })
   ```

4. **Clean Up Old Logs**: Monitor buffer size
   ```typescript
   logger.clear() // Clear when needed
   ```

5. **Export for Analysis**: Regular log exports
   ```bash
   curl "http://localhost:3001/api/logs?format=csv" > logs.csv
   ```

## 9. Performance Considerations

- **Log Buffer**: 10,000 entries per logger (configurable)
- **Metrics Collection**: Minimal overhead (~<1ms per log)
- **Export Performance**: Large exports (~100KB for 1000 logs) may take 1-2 seconds
- **Search Performance**: O(n) filtering, use indexes for large datasets

## 10. Future Enhancements

- [ ] Log persistence to file/database
- [ ] Real-time log streaming via WebSocket
- [ ] Advanced analytics and patterns
- [ ] Machine learning anomaly detection
- [ ] Distributed tracing visualization
- [ ] Log aggregation from multiple instances
- [ ] Custom log formatters
- [ ] Log compression for long-term storage

## Summary

The comprehensive logging and error handling system provides:

✅ **Complete Error Coverage**: All errors captured and handled
✅ **Intelligent Recovery**: 6 recovery strategies for resilience
✅ **Rich Logging**: Multi-level, multi-category structured logging
✅ **Smart UI**: Expandable, searchable, filterable error panels
✅ **Full Integration**: Correlation IDs, metrics, alerts
✅ **Production Ready**: Fully tested and documented

The system ensures maximum observability and reliability for the CTS v3 Trade Engine.
