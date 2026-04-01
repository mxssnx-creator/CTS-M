# CTS v3.2 Redis Setup & Migration Guide

## Quick Start

### Prerequisites
- Node.js 18+
- Upstash Redis account (free tier available)
- Vercel project (for deployment)

### Step 1: Create Redis Database
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the connection details:
   - REST URL
   - REST Token

### Step 2: Configure Environment Variables
Add to your `.env.local`:
```
UPSTASH_REDIS_REST_URL=your_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### Step 3: Start the Application
```bash
npm run dev
# or for production
npm run build && npm start
```

### Step 4: Run Auto-Migration
The system automatically:
1. Connects to Redis on startup
2. Applies pending migrations
3. Creates all necessary indexes
4. Initializes system configuration

Check logs for "✓ Redis initialization complete!" message

---

## Database Schema

### Connections Table
Stores exchange API connections and trading configurations.
```
Key: connections:{id}
Fields:
  - id: unique identifier
  - name: user-defined name
  - exchange: exchange name (binance, kraken, etc)
  - api_key: encrypted API key
  - api_secret: encrypted secret
  - testnet: boolean
  - is_enabled: boolean
  - margin_type: cross/isolated
  - position_mode: hedge/one-way
  - volume_factor: decimal
  - created_at: ISO timestamp
  - updated_at: ISO timestamp
```

### Trades Table
Records all executed trades.
```
Key: trades:{connection_id}
Sorted Set (by timestamp):
  - id: unique trade identifier
  - connection_id: connection reference
  - symbol: trading pair
  - side: buy/sell
  - quantity: amount
  - price: execution price
  - timestamp: execution time
  - status: pending/completed/failed
```

### Positions Table
Tracks open and closed positions.
```
Key: positions:{id}
Fields:
  - id: unique identifier
  - connection_id: connection reference
  - symbol: trading pair
  - quantity: position size
  - entry_price: entry price
  - current_price: current market price
  - pnl: profit/loss
  - status: open/closed
  - created_at: ISO timestamp
  - closed_at: ISO timestamp (if closed)
```

### Settings Table
System and user settings.
```
Key: settings:{key}
Value: JSON string
Examples:
  - settings:system:config
  - settings:system:initialized_at
  - settings:system:version
  - settings:user:{user_id}:preferences
```

---

## API Endpoints

### System Status
```
GET /api/system/init-status
Response:
{
  "status": "ready",
  "initialized": true,
  "ready": true,
  "database": {
    "type": "redis",
    "connected": true
  },
  "migrations": {
    "current_version": "001",
    "latest_version": "001",
    "up_to_date": true
  },
  "statistics": {
    "total_keys": 45,
    "memory_used": "1.2MB"
  }
}
```

### Run Migrations
```
POST /api/install/database/migrate
Response:
{
  "success": true,
  "message": "Redis migrations completed",
  "status": {
    "schema_version": "001",
    "indexes_created": true,
    "ttl_configured": true
  }
}
```

### Flush Database
```
POST /api/install/database/flush
Warning: This clears ALL data!
Response:
{
  "success": true,
  "message": "Redis database flushed and reinitialized"
}
```

### Get Connections
```
GET /api/settings/connections
Response:
[
  {
    "id": "conn_123",
    "name": "Binance Spot",
    "exchange": "binance",
    "is_enabled": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Connection
```
POST /api/settings/connections
Body:
{
  "name": "My Connection",
  "exchange": "binance",
  "api_key": "...",
  "api_secret": "...",
  "testnet": false,
  "margin_type": "cross"
}
```

### Update Connection
```
PUT /api/settings/connections/{id}
Body: partial connection object
```

### Delete Connection
```
DELETE /api/settings/connections/{id}
```

---

## Monitoring & Management

### Check Database Status
- Go to Settings → Install tab
- View real-time Redis statistics
- See connection count and total keys

### View Migrations
- Go to Settings → Install → Configure tab
- View current schema version
- See all enabled features

### Run Manual Migrations
Click "Run Migrations" button in Settings → Install

### Emergency Reset
Click "Flush & Reinit" to clear and reinitialize (USE WITH CAUTION)

---

## Performance Optimization

### Indexes
All data is indexed for fast queries:
- By connection ID
- By symbol
- By timestamp
- By status

### TTL Policies
Automatic data cleanup:
- Connections: 30 days
- Trades: 90 days
- Positions: 60 days
- Logs: 7 days

### Query Patterns
```typescript
// Get all connections
const connections = await getAllConnections()

// Get specific connection
const conn = await getConnection(id)

// Update connection
await updateConnection(id, { is_enabled: false })

// Delete connection
await deleteConnection(id)

// Get connection trades
const trades = await getConnectionTrades(connectionId)

// Get positions
const positions = await getConnectionPositions(connectionId)
```

---

## Troubleshooting

### "Redis not connected"
- Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- Verify Upstash account is active
- Check network connectivity

### "Migrations failed"
- Clear browser cache
- Check `/api/system/init-status` endpoint
- Review console logs for details
- Try "Flush & Reinit" if stuck

### "Keys not persisting"
- Verify UPSTASH_REDIS_REST_TOKEN is correct
- Check Redis database has sufficient storage
- Review TTL settings for key expiration

### "High latency"
- Check Upstash instance is in same region
- Verify rate limits aren't exceeded
- Consider upgrading plan for more throughput

---

## Backup & Recovery

### Backup Data
```bash
# Export all keys to file
redis-cli --rdb /path/to/backup.rdb
```

### Restore Data
```bash
# Restore from backup
redis-cli --pipe < /path/to/backup.rdb
```

### Manual Export
Use Upstash console to export data as JSON

---

## Deployment

### Vercel Deployment
1. Set environment variables in Vercel project settings:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
2. Deploy normally - migrations run automatically
3. Check deployment logs for "✓ Redis initialization complete!"

### Self-Hosted
1. Set environment variables on your server
2. Run migrations: `curl -X POST http://localhost:3000/api/install/database/migrate`
3. Verify with: `curl http://localhost:3000/api/system/init-status`

---

## Support

- Documentation: `/REDIS_DATABASE.md`
- Migration Details: `/REDIS_MIGRATION_FINAL.md`
- API Logs: `/api/system/logs`
- System Status: `/api/system/init-status`

For issues:
1. Check system status endpoint
2. Review console logs
3. Verify environment variables
4. Check Upstash dashboard for database stats
