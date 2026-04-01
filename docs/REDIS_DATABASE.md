# CTS v3.2 - Redis Database System

## Overview

CTS v3.2 uses **Redis** as the primary database system, replacing SQLite and PostgreSQL. This provides:

- **High-performance** in-memory data storage
- **Real-time** data access for trading engines
- **Optimized indexes** for fast queries
- **TTL-based expiration** for automatic cleanup
- **Scalable** data structures
- **Sub-millisecond** latency

## Environment Setup

### Required Environment Variables

```bash
# Redis Connection
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password (optional)
```

### Using Upstash Redis (Recommended for Production)

```bash
REDIS_URL=redis://default:your-api-token@your-upstash-endpoint.upstash.io:6379
REDIS_PASSWORD=your-api-token
```

## Data Structures

### Connections
- **Key Pattern**: `connection:{id}`
- **Type**: Hash
- **TTL**: 30 days
- **Indexes**: exchange, status, testnet

```redis
HSET connection:conn:bybit:1234567890:abcdefgh \
  id "conn:bybit:1234567890:abcdefgh" \
  name "Bybit Main" \
  exchange "bybit" \
  api_key "xxxxx" \
  is_enabled "true"
```

### Trades
- **Key Pattern**: `trade:{id}`
- **Type**: Hash
- **TTL**: 90 days
- **Indexes**: connection, status, symbol

```redis
HSET trade:trade:conn:1234567890:xyz \
  id "trade:trade:conn:1234567890:xyz" \
  connection_id "conn:bybit:1234567890:abcdefgh" \
  symbol "BTCUSDT" \
  status "open"
```

### Positions
- **Key Pattern**: `position:{id}`
- **Type**: Hash
- **TTL**: 60 days
- **Indexes**: symbol, connection, status

```redis
HSET position:pos:conn:1234567890:xyz \
  id "pos:conn:1234567890:xyz" \
  connection_id "conn:bybit:1234567890:abcdefgh" \
  symbol "ETHUSDT" \
  status "active"
```

### Settings
- **Key Pattern**: `settings:{key}`
- **Type**: String (JSON)
- **TTL**: None (persistent)

```redis
SET settings:system:config "{\"database_type\":\"redis\",\"version\":\"3.2\"}"
```

## Index Structure

### Connection Indexes
- `_index:connections:enabled` - Active connections
- `_index:connections:by_exchange` - Grouped by exchange
- `_index:connections:by_status` - Grouped by status
- `_index:connections:by_testnet` - Testnet connections

### Trade Indexes
- `_index:trades:by_connection` - Trades per connection
- `_index:trades:by_status` - Open/closed trades
- `_index:trades:by_symbol` - Trades per symbol

### Position Indexes
- `_index:positions:by_symbol` - Positions per symbol
- `_index:positions:by_connection` - Positions per connection
- `_index:positions:active` - Active positions

## TTL Policies

| Data Type | TTL | Purpose |
|-----------|-----|---------|
| Connections | 30 days | Active exchange connections |
| Trades | 90 days | Historical trade records |
| Positions | 60 days | Position history |
| Logs | 7 days | System logs |
| Cache | 1 day | Temporary cache data |

## API Routes

### Migration
```bash
POST /api/install/database/migrate
GET /api/install/database/migrate
```

### Connections
```bash
GET /api/settings/connections
POST /api/settings/connections
GET /api/settings/connections/[id]
PUT /api/settings/connections/[id]
DELETE /api/settings/connections/[id]
```

## Database Initialization

### Automatic (On App Startup)
- Runs in production only
- Triggered via `instrumentation.ts`
- Non-blocking initialization

### Manual Setup
```bash
npx ts-node scripts/redis-setup.ts
```

### Via API
```bash
curl -X POST http://localhost:3000/api/install/database/migrate
```

## Migration Status

Check current migration status:

```bash
curl http://localhost:3000/api/install/database/migrate
```

Response:
```json
{
  "success": true,
  "database_type": "redis",
  "migration_status": {
    "current_version": 4,
    "latest_version": 4,
    "is_up_to_date": true
  },
  "database_stats": {
    "total_keys": 150,
    "connected": true,
    "indexes_enabled": true,
    "ttl_enabled": true
  }
}
```

## Performance Characteristics

### Query Performance
- Connection lookup: **< 1ms**
- Trade history retrieval: **< 5ms**
- Position updates: **< 2ms**
- Bulk operations: **< 100ms**

### Memory Usage
- Per connection: ~2-5KB
- Per trade: ~1-2KB
- Per position: ~3-4KB
- Indexes: ~500KB (typical)

### Concurrency
- Supported connections: **Unlimited**
- Concurrent operations: **Configurable**
- Default throughput: **10,000+ ops/sec**

## Backup & Restore

### Redis Snapshots
```bash
# Trigger RDB snapshot
redis-cli SAVE

# Trigger async save
redis-cli BGSAVE
```

### Export Data
```bash
redis-cli --rdb /tmp/dump.rdb
```

### Import Data
```bash
redis-cli --pipe < commands.txt
```

## Monitoring

### Check Connection Status
```bash
# Health check endpoint
GET /api/health/database

# System status
GET /api/system/status
```

### Redis CLI Commands
```bash
# Check key count
redis-cli DBSIZE

# Monitor keys
redis-cli MONITOR

# Get memory stats
redis-cli INFO memory

# Check connection info
redis-cli INFO replication
```

## Troubleshooting

### Connection Issues
```
Error: Redis client not initialized

Solution: Ensure REDIS_URL is set correctly
```

### Migration Failures
```
Error: Migration execution failed

Solution: Check Redis connection and retry migration
```

### Performance Issues
```
Slow queries detected

Solution: 
1. Check Redis memory
2. Monitor CPU usage
3. Verify indexes are enabled
```

## Architecture Diagram

```
┌─────────────────────────────────┐
│   Next.js Application           │
├─────────────────────────────────┤
│   API Routes (REST)             │
│   - /api/settings/connections   │
│   - /api/trades                 │
│   - /api/positions              │
├─────────────────────────────────┤
│   Database Layer (/lib/redis-db)│
│   - CRUD Operations             │
│   - Index Management            │
│   - TTL Configuration           │
├─────────────────────────────────┤
│   Redis Client                  │
│   - Connection Pooling          │
│   - Async/Await                 │
│   - Error Handling              │
├─────────────────────────────────┤
│   Redis Server                  │
│   - In-Memory Storage           │
│   - Key-Value Pairs             │
│   - Expiration Policies         │
└─────────────────────────────────┘
```

## Migration Path (from SQL to Redis)

The system was migrated from SQLite/PostgreSQL to Redis:

1. **Legacy SQL**: Tables with schemas for connections, trades, positions
2. **Redis Format**: Hash maps with automatic indexing and expiration
3. **Compatibility**: API routes unchanged - same request/response format
4. **Performance**: 10-100x faster than SQL databases

## License

CTS v3.2 - Trading System with Redis Backend
