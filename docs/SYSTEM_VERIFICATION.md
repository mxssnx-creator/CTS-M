# System Verification Guide

## Quick System Check

Run the quick system check to verify all components are in place:

```bash
npm run verify:system
```

Or directly:

```bash
node scripts/quick-system-check.js
```

## Health Monitoring

### Check System Health

Visit the comprehensive monitoring endpoint:

```bash
curl http://localhost:3000/api/monitoring/comprehensive
```

Or use the npm script:

```bash
npm run health
```

### API Endpoints

#### Connection Management

**Test Connection:**
```bash
curl -X POST http://localhost:3000/api/settings/connections/{id}/test
```

**Toggle Connection:**
```bash
curl -X POST http://localhost:3000/api/settings/connections/{id}/toggle \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true, "is_live_trade": false}'
```

#### Trade Engine Control

**Start Trade Engine:**
```bash
curl -X POST http://localhost:3000/api/trade-engine/start \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "conn-123"}'
```

**Stop Trade Engine:**
```bash
curl -X POST http://localhost:3000/api/trade-engine/stop \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "conn-123"}'
```

**Get Engine Status:**
```bash
curl http://localhost:3000/api/trade-engine/status
```

**Get Progression:**
```bash
curl http://localhost:3000/api/trade-engine/progression
```

#### Monitoring

**System Health:**
```bash
curl http://localhost:3000/api/system/health-check
```

**Comprehensive Metrics:**
```bash
curl http://localhost:3000/api/monitoring/comprehensive
```

**System States:**
```bash
curl http://localhost:3000/api/monitoring/system
```

## Workflow Verification

### 1. Connection Setup Workflow

```bash
# Step 1: Create connection (via UI or API)
# Step 2: Test connection
curl -X POST http://localhost:3000/api/settings/connections/{id}/test

# Step 3: Enable connection
curl -X POST http://localhost:3000/api/settings/connections/{id}/toggle \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true, "is_live_trade": false}'

# Step 4: Verify connection status
curl http://localhost:3000/api/monitoring/comprehensive | jq '.connections'
```

### 2. Trade Engine Workflow

```bash
# Step 1: Start trade engine for a connection
curl -X POST http://localhost:3000/api/trade-engine/start \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "your-connection-id"}'

# Step 2: Monitor engine status
curl http://localhost:3000/api/trade-engine/status

# Step 3: Check progression
curl http://localhost:3000/api/trade-engine/progression

# Step 4: Stop engine when needed
curl -X POST http://localhost:3000/api/trade-engine/stop \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "your-connection-id"}'
```

### 3. Monitoring Workflow

```bash
# Check overall system health
curl http://localhost:3000/api/system/health-check | jq

# Get comprehensive metrics
curl http://localhost:3000/api/monitoring/comprehensive | jq

# Filter for specific data
curl http://localhost:3000/api/monitoring/comprehensive | jq '.tradeEngines'
curl http://localhost:3000/api/monitoring/comprehensive | jq '.connections'
curl http://localhost:3000/api/monitoring/comprehensive | jq '.trading'
```

## System Integrity Checks

### File Structure

```bash
# Verify critical directories exist
ls -la app/api/
ls -la lib/trade-engine/
ls -la lib/exchange-connectors/
ls -la data/
```

### Configuration Files

```bash
# Check connections configuration
cat data/connections.json | jq

# Check settings configuration
cat data/settings.json | jq
```

### Database Verification

```bash
# Check database connection (requires psql)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM trade_engine_state;"

# Check recent engine activity
psql $DATABASE_URL -c "SELECT * FROM trade_engine_state ORDER BY updated_at DESC LIMIT 5;"
```

## Automated Testing

### Run Complete System Test

```bash
npm run test:system
```

### Health Check Script

Create a monitoring cron job:

```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -s http://localhost:3000/api/system/health-check | jq '.status' >> /var/log/cts-health.log
```

## Troubleshooting

### Engine Won't Start

1. Check connection is enabled and tested:
```bash
curl http://localhost:3000/api/monitoring/comprehensive | jq '.connections.details[] | select(.id=="your-id")'
```

2. Check for errors:
```bash
curl http://localhost:3000/api/monitoring/comprehensive | jq '.errors'
```

3. Review logs:
```bash
tail -f /var/log/cts-errors.log
```

### Connection Test Fails

1. Verify API credentials in `data/connections.json`
2. Check rate limiting intervals in `data/settings.json`
3. Test manually with curl
4. Review connection test logs

### Engine Status Shows Error

1. Check database connection
2. Review trade engine state table
3. Check component health:
```bash
curl http://localhost:3000/api/monitoring/comprehensive | jq '.tradeEngines.componentHealth'
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Response Times:**
   - API endpoint latency
   - Database query times
   - Exchange API calls

2. **Engine Health:**
   - Cycle counts
   - Average cycle duration
   - Error rates

3. **Trading Activity:**
   - Orders per hour
   - Trades per hour
   - Position turnover

4. **System Resources:**
   - Memory usage
   - CPU usage
   - Database size

### Monitoring Dashboard

Access metrics via comprehensive endpoint and visualize:

```bash
# Get metrics in JSON format
curl http://localhost:3000/api/monitoring/comprehensive > metrics.json

# Use jq to extract specific metrics
cat metrics.json | jq '.tradeEngines.details[] | {connection: .connectionName, cycles: .indicationCycles}'
```

## Alerts & Notifications

### Health Status Codes

- `healthy`: All systems operational
- `degraded`: Some components underperforming
- `critical`: Major issues detected
- `error`: System failure

### Recommended Alerts

1. Engine health degraded for > 5 minutes
2. Error count > 10 in last hour
3. No active connections
4. Database connection lost
5. API response time > 5 seconds

---

**Last Updated:** 2026-01-27  
**System Version:** 3.1.0
