# Server-Sent Events (SSE) Real-Time Update System

## Overview

This document describes the complete Server-Sent Events (SSE) infrastructure for real-time updates in CTS v3. SSE is used instead of WebSocket for Next.js compatibility and provides a robust, authenticated, and scalable real-time update mechanism.

## Architecture

### Why SSE Instead of WebSocket?

- **Next.js Compatibility**: WebSocket requires additional server infrastructure; SSE works natively with Next.js
- **HTTP Protocol**: SSE uses standard HTTP, works with all existing proxies and load balancers
- **Automatic Reconnection**: Built-in EventSource API handles reconnection automatically
- **Message History**: Server-side message history enables client catch-up on reconnect
- **Authentication**: Standard HTTP headers for auth, no additional protocol overhead

## System Components

### 1. Server-Side Broadcasting (`lib/event-broadcaster.ts`)

**Global singleton** managing all SSE client subscriptions and message distribution.

```typescript
interface EventBroadcaster {
  registerClient(connectionId: string, response: any): { unsubscribe, send }
  broadcast(message: BroadcastMessage): void
  broadcastPositionUpdate(connectionId: string, data: any): void
  broadcastStrategyUpdate(connectionId: string, data: any): void
  broadcastIndicationUpdate(connectionId: string, data: any): void
  broadcastProcessingProgress(connectionId: string, data: any): void
  broadcastEngineStatus(connectionId: string, data: any): void
  getHistory(connectionId: string): BroadcastMessage[]
  getStats(): { totalConnections, totalClients, connectionStats }
}
```

**Key Features:**
- Per-connection message history (last 100 messages)
- Automatic client registration/unregistration
- Statistics tracking for monitoring
- Error handling and silent failures for robustness

### 2. SSE API Route (`app/api/ws/route.ts`)

**RESTful endpoint** handling SSE client connections.

```
GET /api/ws?connectionId=<ID>
```

**Response Format:**
- Content-Type: `text/event-stream`
- Transfer-Encoding: `chunked`
- 30-second heartbeat messages
- Auto-reconnection support

**Message Format:**
```
data: {"type":"position-update","connectionId":"bingx-x01","data":{...},"timestamp":"2026-03-25T...","sequence":123}\n\n
```

**Connection Lifecycle:**
1. Client sends GET request with connectionId
2. Server validates authentication
3. Server sends "connected" event with timestamp
4. Server sends message history (last 10 messages) for catch-up
5. Server registers client for future broadcasts
6. Server sends 30s heartbeat to keep connection alive
7. On client disconnect, server auto-cleanup

### 3. Broadcast Helper Module (`lib/broadcast-helpers.ts`)

Convenience functions for engines to emit events.

```typescript
emitPositionUpdate(connectionId, position): void
emitStrategyUpdate(connectionId, strategy): void
emitIndicationUpdate(connectionId, indication): void
emitProcessingProgress(connectionId, phase, progress, ...): void
emitEngineStatus(connectionId, state, ...): void
getBroadcasterStats(): { totalConnections, totalClients, ... }
```

### 4. Client-Side SSE Client (`lib/sse-client.ts`)

**EventSource-based client** for consuming SSE streams.

```typescript
class SSEClient {
  connect(): Promise<void>
  disconnect(): void
  subscribe(eventType: SSEEventType, callback): () => void
  emit(eventType: SSEEventType, data: any): void
  getConnectionState(): string
  isConnected(): boolean
}

getSSEClient(connectionId: string): SSEClient
disconnectSSE(): void
```

**Features:**
- Automatic exponential backoff reconnection (5 attempts)
- Connection state tracking
- Subscription-based event model
- Unsubscribe function for cleanup

### 5. React Hooks (`lib/use-websocket.ts`)

**Custom hooks** for consuming SSE in React components.

```typescript
// Main hook
useRealTime(connectionId: string): {
  isConnected: boolean
  connectionError: string | null
  subscribe: (eventType, callback) => unsubscribe
}

// Specialized hooks
usePositionUpdates(connectionId: string, callback: (update) => void): void
useStrategyUpdates(connectionId: string, callback: (update) => void): void
useIndicationUpdates(connectionId: string, callback: (update) => void): void
useProcessingProgress(connectionId: string, callback: (progress) => void): void
useEngineStatus(connectionId: string, callback: (status) => void): void
```

## Event Types and Data Structures

### Position Update Event

**Type:** `position-update`

**Data Structure:**
```typescript
{
  id: string                    // unique position ID
  symbol: string                // e.g., "BTCUSDT"
  currentPrice: number          // current market price
  unrealizedPnl: number         // unrealized profit/loss
  unrealizedPnlPercent: number  // P&L percentage
  status: 'open' | 'closing' | 'closed'
  updatedAt: string             // ISO timestamp
}
```

**Emitted From:** `PseudoPositionManager` on creation, update, and closure

### Strategy Update Event

**Type:** `strategy-update`

**Data Structure:**
```typescript
{
  id: string                    // unique strategy ID
  symbol: string                // trading pair
  profit_factor: number         // profitability metric
  win_rate: number              // success rate
  active_positions: number      // number of active positions
  updatedAt: string             // ISO timestamp
}
```

**Emitted From:** `StrategySetsProcessor` on strategy calculation

### Indication Update Event

**Type:** `indication-update`

**Data Structure:**
```typescript
{
  id: string                    // unique indication ID
  symbol: string                // trading pair
  direction: 'UP' | 'DOWN' | 'NEUTRAL'
  confidence: number            // 0-100
  strength: number              // signal strength metric
  timestamp: string             // ISO timestamp
}
```

**Emitted From:** `IndicationSetsProcessor` on signal generation

### Processing Progress Event

**Type:** `processing-progress`

**Data Structure:**
```typescript
{
  phase: 'prehistoric' | 'realtime' | 'strategy' | 'indication'
  progress: number              // 0-100
  itemsProcessed: number
  totalItems: number
  currentTimeframe: string       // e.g., '1m', '5m', '1h'
  estimatedTimeRemaining: number // seconds
}
```

**Emitted From:** `EventBroadcaster.broadcastProcessingProgress()`

### Engine Status Event

**Type:** `engine-status`

**Data Structure:**
```typescript
{
  state: 'idle' | 'loading' | 'processing' | 'trading' | 'error'
  activeProcesses: string[]     // names of running processes
  lastUpdate: string            // ISO timestamp
  cycleCount: number            // total cycles executed
  errorCount: number            // error count
}
```

**Emitted From:** `EventBroadcaster.broadcastEngineStatus()`

## Integration Points

### Engine Integration

All trading engines emit real-time updates via `lib/broadcast-helpers.ts`:

1. **Position Manager** (`lib/trade-engine/pseudo-position-manager.ts`)
   - Creates broadcast on `createPosition()` with initial data
   - Updates broadcast on `updatePosition()` with calculated PnL
   - Closes broadcast on `closePosition()` with realized PnL

2. **Strategy Processor** (`lib/strategy-sets-processor.ts`)
   - Broadcasts on strategy calculation completion
   - Includes profit factor, win rate, active positions

3. **Indication Processor** (`lib/indication-sets-processor.ts`)
   - Broadcasts on indication generation
   - Includes direction, confidence, strength

### UI Page Integration

All major pages subscribe to real-time updates:

1. **Live Trading Page** (`app/live-trading/page.tsx`)
   - Subscribes to `position-update` events
   - Merges updates into position list
   - Handles new positions and closures
   - Falls back to simulation for demo mode

2. **Strategies Page** (`app/strategies/page.tsx`)
   - Subscribes to `strategy-update` events
   - Updates matching strategies with latest metrics
   - Efficient symbol-based matching

3. **Indications Page** (`app/indications/page.tsx`)
   - Subscribes to `indication-update` events
   - Prepends new signals to list immediately
   - Updates existing signals by ID

## Monitoring and Diagnostics

### Broadcast Stats API

**Endpoint:** `GET /api/broadcast/stats` (requires auth)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-03-25T10:30:00Z",
    "totalConnections": 5,
    "totalClients": 12,
    "connectionStats": {
      "bingx-x01": 3,
      "bybit-x03": 2
    },
    "historySize": 5,
    "serverTime": 1711353000000
  }
}
```

### Broadcast Health API

**Endpoint:** `GET /api/broadcast/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "broadcaster": {
      "active": true,
      "totalConnections": 5,
      "totalClients": 12,
      "historySize": 5
    },
    "sse": {
      "enabled": true,
      "protocol": "Server-Sent Events",
      "endpoint": "/api/ws",
      "heartbeat": "30s"
    },
    "timestamp": "2026-03-25T10:30:00Z"
  }
}
```

Returns 503 on system errors.

## Connection Management

### Auto-Reconnection

SSE client automatically reconnects with exponential backoff:

```
Attempt 1: 3 seconds
Attempt 2: 6 seconds
Attempt 3: 12 seconds
Attempt 4: 24 seconds
Attempt 5: 48 seconds (final)
```

### Message History

Server maintains per-connection message history (max 100 messages) for reconnect catch-up:

1. Client connects
2. Server sends last 10 historical messages
3. Client processes history for state synchronization
4. Client ready for new events

### Heartbeat

Server sends 30-second heartbeat comments to keep connections alive:

```
: heartbeat at 2026-03-25T10:30:00Z
```

This prevents proxy/firewall timeouts without disrupting client logic.

## Performance Considerations

### Broadcast Efficiency

- **Atomic Operations**: Each broadcast is a single operation
- **No Queuing**: Messages go directly to connected clients
- **Connection Count**: Scales to hundreds of concurrent clients per connection
- **Memory**: Message history capped at 100 messages per connection

### Network Optimization

- **Message Batching**: Events batched by phase to reduce overhead
- **Compression**: Relies on HTTP compression (gzip)
- **SSE Format**: Lightweight text format (no binary overhead)
- **Persistent Connections**: Reuse single TCP connection per client

### Broadcast Statistics

Monitor via `/api/broadcast/stats`:

```typescript
interface BroadcasterStats {
  totalConnections: number      // unique connectionIds
  totalClients: number          // total connected clients
  connectionStats: Record<connectionId, clientCount>
  historySize: number           // total messages in history
}
```

## Best Practices

### 1. Always Use Connection ID

- Filter broadcasts by connection ID to avoid cross-connection pollution
- Use `getBroadcaster().broadcastX(connectionId, data)`

### 2. Handle Reconnections Gracefully

- Subscribe to connection state changes
- Reload critical state on reconnect
- Use message history for state synchronization

### 3. Unsubscribe on Component Unmount

```typescript
useEffect(() => {
  const unsubscribe = subscribe('event-type', callback)
  return () => unsubscribe() // cleanup
}, [])
```

### 4. Handle Demo Mode

- Skip SSE connections for demo mode (connectionId === 'demo-mode')
- Use fallback simulation for demo pages
- Check connection state before emitting

### 5. Monitor System Health

- Regularly check `/api/broadcast/health`
- Log connection stats for debugging
- Alert on high error counts

## Troubleshooting

### Clients Not Receiving Updates

1. **Check connection ID matches**: Verify client connectionId matches broadcasted connectionId
2. **Check SSE route**: Ensure `/api/ws?connectionId=X` is accessible
3. **Check subscription**: Verify event type name matches exactly (case-sensitive)
4. **Check authentication**: Ensure session is valid

### Connection Drops

1. **Check heartbeat**: Verify 30s heartbeat is being sent
2. **Check proxy timeout**: May need to increase idle timeout on load balancer
3. **Check firewall**: May be blocking SSE (requires Connection: keep-alive)
4. **Check memory**: High memory usage can cause connection drops

### Slow Updates

1. **Check broadcast stats**: Monitor connection count and client count
2. **Check message history size**: Trim history if too large
3. **Check network latency**: Use browser DevTools to measure SSE latency
4. **Check processor load**: May need to batch broadcasts more efficiently

## Future Enhancements

- [ ] Message compression for large payloads
- [ ] Priority-based message delivery
- [ ] Client-side message filtering
- [ ] Subscription management UI
- [ ] Performance metrics dashboard
- [ ] Message replay API
- [ ] Custom event schema validation
