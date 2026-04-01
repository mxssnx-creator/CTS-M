# Workflow Logging and Handling System

## Overview

The Workflow Logging and Handling System provides comprehensive event tracking, logging, and handling for all trade engine operations including:

- Engine lifecycle events (start, stop, errors)
- Trade entry/exit events
- Indication signal detections
- Progression cycle completions
- Pseudo position updates
- Order placement and fills
- Position modifications

## Components

### 1. WorkflowLogger (`lib/workflow-logger.ts`)

Centralized logging system that stores structured events in Redis with retention policies.

**Features:**
- Structured event logging with metadata
- Automatic log retention (7 days default)
- Per-connection log limits (1000 logs max)
- Statistics aggregation
- Multiple logging methods for different event types

**Key Methods:**

```typescript
// Log a generic workflow event
await WorkflowLogger.logEvent(connectionId, eventType, message, {
  symbol?: string,
  status?: "success" | "pending" | "failed" | "warning",
  details?: Record<string, any>,
  duration?: number
})

// Log specific event types
await WorkflowLogger.logEngineEvent(connectionId, "start", "Engine started", { ... })
await WorkflowLogger.logTradeEvent(connectionId, symbol, "entry", { side: "long", quantity: 1 })
await WorkflowLogger.logIndicationSignal(connectionId, symbol, "RSI", "buy", 75)
await WorkflowLogger.logProgressionCycle(connectionId, cycleNum, duration, "success")
await WorkflowLogger.logPseudoPositionUpdate(connectionId, symbol, "created", { ... })

// Retrieve logs
const logs = await WorkflowLogger.getLogs(connectionId, 100, eventType?)
const stats = await WorkflowLogger.getStats(connectionId, timeWindowMs?)
await WorkflowLogger.clearLogs(connectionId)
```

**Event Types:**
- `engine_start` - Engine started for connection
- `engine_stop` - Engine stopped for connection
- `engine_error` - Engine encountered an error
- `indication_check` - Indication was checked
- `indication_signal` - Indication signal detected
- `strategy_evaluate` - Strategy evaluation completed
- `strategy_execute` - Strategy was executed
- `order_place` - Order was placed
- `order_fill` - Order was filled
- `order_cancel` - Order was cancelled
- `position_open` - New position opened
- `position_close` - Position closed
- `position_modify` - Position modified
- `trade_entry` - Trade entry executed
- `trade_exit` - Trade exit executed
- `progression_cycle` - Progression cycle completed
- `pseudo_position_update` - Pseudo position state changed

### 2. WorkflowEventHandler (`lib/workflow-event-handler.ts`)

Event routing and handling system with retry logic and error callbacks.

**Features:**
- Event handler registration and routing
- Automatic retry logic with exponential backoff
- Timeout handling
- Error callbacks and logging
- Global instance management

**Usage:**

```typescript
import { getGlobalWorkflowEventHandler } from "@/lib/workflow-event-handler"

// Get the global handler
const handler = getGlobalWorkflowEventHandler()

// Register handlers for specific events
handler.registerHandler("trade_entry", {
  async handle(connectionId, eventType, data) {
    console.log(`Trade entry for ${connectionId}:`, data)
    // Custom logic here
  }
})

// Emit an event to all registered handlers
await handler.emit(connectionId, "trade_entry", {
  symbol: "BTCUSDT",
  side: "long",
  quantity: 1,
  entryPrice: 45000
})
```

### 3. Workflow Logs API (`app/api/workflow-logs/[id]/route.ts`)

REST endpoints for accessing workflow logs and statistics.

**GET Endpoints:**

```bash
# Get all logs for a connection
GET /api/workflow-logs/[connectionId]?limit=100

# Get logs of specific event type
GET /api/workflow-logs/[connectionId]?eventType=trade_entry&limit=50

# Get statistics only
GET /api/workflow-logs/[connectionId]?stats=true&timeWindow=3600000

# Get logs from last hour
GET /api/workflow-logs/[connectionId]?timeWindow=3600000
```

**DELETE Endpoint:**

```bash
# Clear all logs for a connection
DELETE /api/workflow-logs/[connectionId]
```

## Integration Examples

### Engine Lifecycle Integration

```typescript
import { WorkflowLogger } from "@/lib/workflow-logger"

class TradeEngineManager {
  async start() {
    try {
      // ... start logic
      await WorkflowLogger.logEngineEvent(
        this.connectionId,
        "start",
        `Engine started successfully`,
        { apiType: this.apiType, exchange: this.exchange }
      )
    } catch (error) {
      await WorkflowLogger.logEngineEvent(
        this.connectionId,
        "error",
        `Engine start failed: ${error.message}`,
        { error: String(error) }
      )
    }
  }
}
```

### Indication Processor Integration

```typescript
import { WorkflowLogger } from "@/lib/workflow-logger"

class IndicationProcessor {
  async processIndicationsForSymbol(connectionId, symbol, indications) {
    for (const indication of indications) {
      if (indication.signal) {
        await WorkflowLogger.logIndicationSignal(
          connectionId,
          symbol,
          indication.name,
          indication.signal,
          indication.strength
        )
      }
    }
  }
}
```

### Trade Entry/Exit Integration

```typescript
import { WorkflowLogger } from "@/lib/workflow-logger"

class TradeExecutor {
  async executeTrade(connectionId, symbol, side, quantity, price) {
    try {
      const orderId = await this.placeOrder(symbol, side, quantity, price)
      await WorkflowLogger.logTradeEvent(connectionId, symbol, "entry", {
        side,
        quantity,
        entryPrice: price,
        orderId,
        reason: "Indication signal"
      })
    } catch (error) {
      await WorkflowLogger.logEvent(connectionId, "order_place", 
        `Order placement failed: ${error.message}`, 
        { symbol, status: "failed", details: { error: String(error) } }
      )
    }
  }

  async closeTrade(connectionId, symbol, side, quantity, exitPrice, pnl) {
    await WorkflowLogger.logTradeEvent(connectionId, symbol, "exit", {
      side,
      quantity,
      exitPrice,
      pnl,
      reason: "Profit target reached"
    })
  }
}
```

### Progression Cycle Integration

```typescript
import { WorkflowLogger } from "@/lib/workflow-logger"

class ProgressionStateManager {
  async completeCycle(connectionId, cycleNumber, cycleData) {
    const startTime = Date.now()
    try {
      // ... cycle logic
      const duration = Date.now() - startTime
      await WorkflowLogger.logProgressionCycle(
        connectionId,
        cycleNumber,
        duration,
        "success",
        {
          basesEvaluated: cycleData.basePositions.length,
          mainsCreated: cycleData.mainPositions.length,
          realsExecuted: cycleData.realPositions.length
        }
      )
    } catch (error) {
      const duration = Date.now() - startTime
      await WorkflowLogger.logProgressionCycle(
        connectionId,
        cycleNumber,
        duration,
        "failed",
        { error: String(error) }
      )
    }
  }
}
```

## Workflow Log Structure

Each workflow log entry contains:

```typescript
interface WorkflowLogEntry {
  id: string                           // Unique log ID
  timestamp: number                    // Unix milliseconds
  connectionId: string                 // Connection being tracked
  eventType: WorkflowEventType         // Type of event
  symbol?: string                      // Trading symbol (if applicable)
  status: "success" | "pending" | "failed" | "warning"
  message: string                      // Human-readable message
  details?: Record<string, any>        // Additional context data
  duration?: number                    // Duration in milliseconds
}
```

## Redis Storage

Logs are stored in Redis using sorted sets:

```
workflow_logs:{connectionId}  (Sorted Set)
  - Score: timestamp
  - Value: JSON-serialized WorkflowLogEntry
  - Expiration: 7 days
  - Max entries per connection: 1000
```

## Statistics Example

```json
{
  "total_events": 450,
  "success_count": 425,
  "failed_count": 15,
  "warning_count": 10,
  "pending_count": 0,
  "avg_duration_ms": 245.67,
  "events_by_type": {
    "indication_check": 250,
    "trade_entry": 45,
    "trade_exit": 42,
    "progression_cycle": 88,
    "order_place": 25
  },
  "time_window_ms": 3600000
}
```

## Best Practices

1. **Always use specific logging methods** - Use `logTradeEvent()`, `logIndicationSignal()`, etc. instead of generic `logEvent()` when possible
2. **Include relevant details** - Add context like order IDs, price levels, quantities to the details object
3. **Track duration** - Include execution time for performance monitoring
4. **Use appropriate status** - Set `status` to "failed" only for errors, "warning" for edge cases, "pending" for ongoing operations
5. **Monitor statistics regularly** - Check stats endpoint to identify patterns and anomalies
6. **Clean up old logs** - Logs auto-expire after 7 days, but can be manually cleared if needed

## Performance Considerations

- Redis sorted set operations: O(log N) for add, O(log N) for trim
- Typical log retrieval (100 entries): < 10ms
- Statistics calculation (1000 entries): < 50ms
- Storage footprint: ~500 bytes per log entry

The logging system is designed to have minimal performance impact on the trade engine while providing complete visibility into system operations.
