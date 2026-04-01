# Redis Migration Complete - CTS v3.2

## ✅ Migration Summary

The CTS (Cryptocurrency Trading System) has been successfully migrated from SQLite/PostgreSQL to **Redis** as the primary database. All core functionality has been refactored to use Redis with indexes, TTLs, and optimizations.

## 📦 What Was Changed

### Core Database Layer
- **Removed**: SQLite and PostgreSQL database code
- **Added**: Redis-native database operations (`/lib/redis-db.ts`)
- **Added**: Redis migration system (`/lib/redis-migrations.ts`)
- **Added**: Database compatibility layer (`/lib/db-compat.ts`)
- **Updated**: Main database module (`/lib/db.ts`) - now Redis-only

### API Routes Updated
- ✅ `/api/settings/connections/*` - Redis-backed connection management
- ✅ `/api/install/database/migrate` - Redis migration runner
- ✅ `/api/admin/reset-and-init` - Redis flush and reinit
- ✅ `/api/auth/login` - Redis user lookup
- ✅ `/api/auth/register` - Redis user creation
- ✅ `/api/preset-types/*` - Redis preset storage
- ✅ `/api/trade-engine/status` - Redis state tracking

### Data Structures (Redis Keys)
```
Connections:
  connection:{id} - Hash containing connection data
  connections:all - Set of all connection IDs
  connections:{exchange} - Set of connections by exchange

Users:
  user:{id} - Hash containing user data
  users:all - Set of all user IDs

Trades:
  trade:{id} - Hash containing trade data
  trades:{connection_id} - Set of trades per connection

Positions:
  position:{id} - Hash containing position data
  positions:{connection_id} - Set of positions per connection

Logs:
  log:{id} - Hash containing log entry
  logs:all - Set of all log IDs
  logs:{category} - Set of logs by category

Settings:
  settings:{key} - Stored configuration values

Migrations:
  migration:version:{version} - Migration tracking
```

## 🚀 Setup Instructions

### Prerequisites
```bash
# Ensure Redis is running (local or cloud)
# Set environment variables:
export REDIS_URL="redis://localhost:6379"
export REDIS_PASSWORD="" # optional
```

### Initialization Steps

1. **Deploy to Vercel**
   ```bash
   git push origin main
   # or deploy via GitHub
   ```

2. **Run Database Migration**
   ```bash
   curl -X POST https://your-app.vercel.app/api/install/database/migrate
   ```

3. **Initialize System Configuration**
   ```bash
   curl -X GET https://your-app.vercel.app/api/install/database/migrate
   ```

### Verification

Check that the system initialized correctly:
```bash
# Check migration status
curl https://your-app.vercel.app/api/install/database/migrate

# Response should show:
{
  "success": true,
  "database_type": "redis",
  "migration_status": {
    "current_version": "latest",
    "latest_version": "latest",
    "is_up_to_date": true
  },
  "database_stats": {
    "total_keys": <number>,
    "connected": true,
    "indexes_enabled": true,
    "ttl_enabled": true
  }
}
```

## 🔑 Key Features

### Indexes & Optimization
- **Connection Indexes**: By exchange, status, testnet flag
- **Trade Indexes**: By connection, status, symbol
- **Position Indexes**: By symbol, connection, active status
- **Settings Indexes**: Key-based retrieval

### TTL Policies
- Connections: 30 days
- Trades: 90 days
- Positions: 60 days
- Logs: 7 days
- Cache: 1 day

### High Performance
- In-memory operation
- Atomic operations
- Pipeline support for bulk operations
- Automatic index maintenance
- Automatic TTL enforcement

## 📊 Data Management

### Connection Management
```typescript
// Create connection
const id = await createConnection({
  name: "My Exchange",
  exchange: "bybit",
  api_type: "perpetual",
  api_key: "...",
  api_secret: "...",
  ...config
});

// Get connection
const conn = await getConnection(id);

// Get all connections
const conns = await getAllConnections();

// Update connection
await updateConnection(id, { ...updates });

// Delete connection
await deleteConnection(id);
```

### Trade Management
```typescript
// Create trade
const tradeId = await createTrade({
  connection_id: connId,
  symbol: "BTCUSDT",
  side: "long",
  quantity: 1.5,
  entry_price: 42000,
  ...tradeData
});

// Get connection trades
const trades = await getConnectionTrades(connId);
```

### Position Management
```typescript
// Create position
const posId = await createPosition({
  connection_id: connId,
  symbol: "BTCUSDT",
  quantity: 1.5,
  entry_price: 42000,
  ...posData
});

// Get active positions
const positions = await getConnectionPositions(connId);
```

## 🔧 Configuration

### Environment Variables
```env
# Required
REDIS_URL=redis://localhost:6379

# Optional
REDIS_PASSWORD=your_password
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Vercel Integration
Add the variables in **Project Settings → Environment Variables**:
- `REDIS_URL`
- `REDIS_PASSWORD` (if needed)

## 🧹 Migration from Old System

If you had data in SQLite/PostgreSQL:

1. **Export Data** (before migration)
   ```bash
   # SQLite
   sqlite3 db.sqlite3 ".dump" > backup.sql

   # PostgreSQL
   pg_dump database_name > backup.sql
   ```

2. **Import to Redis** (after migration)
   Create a custom import script using the Redis operations from `/lib/redis-db.ts`

3. **Verify Migration**
   Check that all data is accessible via the new API routes

## 🛡️ Backup & Recovery

### Backup Redis Data
```bash
# Local
redis-cli BGSAVE
# Creates dump.rdb

# Cloud (Redis Cloud / Upstash)
# Use provider's built-in backup features
```

### Recovery
```bash
# Local: copy dump.rdb to Redis directory and restart
# Cloud: restore from backup via provider console
```

## 📈 Performance Metrics

**Before** (SQLite):
- Single-threaded
- File I/O latency
- Limited concurrent connections

**After** (Redis):
- In-memory operations (~1µs latency)
- Supports 10,000+ ops/sec
- Unlimited concurrent connections
- Built-in clustering support

## 🔄 Compatibility Layer

For backwards compatibility with old code:
- `execute()` - Maps to Redis operations
- `query()` - Fetches data from Redis patterns
- `queryOne()` - Returns single result
- `sql()` - Template literal support

These functions are provided in `/lib/db-compat.ts` and automatically exported from `/lib/db.ts`.

## 🐛 Troubleshooting

### Redis Connection Failed
```
Error: Redis client not initialized
→ Solution: Call initRedis() before operations
```

### Keys Not Found
```
Error: Key doesn't exist
→ Solution: Check key naming pattern is correct
→ Use KEYS pattern to debug
```

### TTL Not Working
```
→ Solution: Ensure await on expire() calls
→ TTL is set during key creation
```

### Migration Stuck
```
→ Solution: Reset and reinit
→ POST /api/admin/reset-and-init
→ Then POST /api/install/database/migrate
```

## ✨ Next Steps

1. ✅ Deploy to Vercel
2. ✅ Run database migration
3. ✅ Create test connection
4. ✅ Verify API endpoints work
5. ✅ Monitor performance metrics

## 📞 Support

For issues or questions about the Redis migration:
- Check `/REDIS_DATABASE.md` for detailed documentation
- Review `/lib/redis-db.ts` for implementation details
- Check `/lib/redis-migrations.ts` for schema definitions

---

**Migration Completed**: Redis v7.0+ ✅
**System Version**: CTS v3.2 ✅
**Database Type**: Redis ✅
**Status**: Ready for Production ✅
