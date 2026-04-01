# System Verification Checklist - CTS v3.1

Complete checklist to verify all systems are working correctly.

## Pre-Launch Verification (Run Before Going Live)

### 1. Database Setup
- [ ] Database created and initialized
- [ ] Tables created (connections, trade_engine_state, etc.)
- [ ] Migrations ran successfully
- [ ] Test queries work

**Verify with:**
```bash
npm run db:status
curl http://localhost:3000/api/system/verify-startup
```

### 2. Trade Engine Infrastructure
- [ ] GlobalTradeEngineCoordinator singleton initialized
- [ ] TradeEngineManager class imported correctly
- [ ] getGlobalTradeEngineCoordinator() returns non-null
- [ ] getGlobalCoordinator() returns correct singleton

**Verify with:**
```bash
curl http://localhost:3000/api/trade-engine/health
```

Expected response:
```json
{
  "success": true,
  "overall": "offline" (if no engines running)
}
```

### 3. Connection Management
- [ ] Can create new connection
- [ ] Can update connection credentials
- [ ] Can test connection
- [ ] Can enable/disable connection
- [ ] Can activate/deactivate connection
- [ ] Can delete connection

**Verify with:**
```bash
# Create connection
curl -X POST http://localhost:3000/api/settings/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Connection",
    "exchange": "bybit",
    "api_key": "test_key",
    "api_secret": "test_secret",
    "is_testnet": true
  }'

# Test connection
curl -X POST http://localhost:3000/api/settings/connections/[id]/test

# Get all connections
curl http://localhost:3000/api/settings/connections
```

### 4. Trade Engine Startup
- [ ] Trade engine starts without errors
- [ ] Engine manager created successfully
- [ ] Engine status updates correctly
- [ ] Auto-start initializes on app startup
- [ ] Connection monitoring active

**Verify with:**
```bash
# Check engine status
curl http://localhost:3000/api/trade-engine/status-all

# Start all engines
curl http://localhost:3000/api/trade-engine/start-all

# Check health
curl http://localhost:3000/api/trade-engine/health
```

### 5. API Endpoints
- [ ] GET /api/settings/connections
- [ ] POST /api/settings/connections
- [ ] GET /api/settings/connections/[id]
- [ ] PATCH /api/settings/connections/[id]
- [ ] DELETE /api/settings/connections/[id]
- [ ] POST /api/settings/connections/[id]/test
- [ ] POST /api/settings/connections/[id]/toggle
- [ ] POST /api/settings/connections/[id]/active
- [ ] DELETE /api/settings/connections/[id]/active
- [ ] POST /api/trade-engine/start
- [ ] GET /api/trade-engine/start-all
- [ ] POST /api/trade-engine/stop
- [ ] GET /api/trade-engine/status-all
- [ ] GET /api/trade-engine/health
- [ ] GET /api/system/verify-startup
- [ ] GET /api/system/verify-apis

**Verify with:**
```bash
curl http://localhost:3000/api/system/verify-apis
```

### 6. UI Components
- [ ] Settings page loads without errors
- [ ] Connection card displays correctly
- [ ] Connection manager v2 works
- [ ] Edit dialog opens and closes
- [ ] Test connection button works
- [ ] Toast notifications display
- [ ] Live trading page loads
- [ ] Can select connection
- [ ] Can start engine from UI

**Verify manually in browser:**
- Navigate to http://localhost:3000/settings
- Navigate to http://localhost:3000/live-trading
- Check browser console for errors

### 7. Connection Manager v2
- [ ] ConnectionManager class initialized
- [ ] markTestPassed() updates state
- [ ] markTestFailed() updates state
- [ ] getConnectionStatus() returns correct status
- [ ] validateConnection() validates properly

**Verify in code:**
```typescript
import { getConnectionManager } from "@/lib/connection-manager"
const manager = getConnectionManager()
console.log(manager.getConnectionStatus("connection_id"))
```

### 8. Error Handling
- [ ] Invalid credentials show user-friendly error
- [ ] Network errors handled gracefully
- [ ] Timeout errors caught and logged
- [ ] JSON parsing errors handled
- [ ] Missing data returns proper errors
- [ ] Connection test logs include timestamps

**Verify with:**
```bash
# Test invalid credentials
curl -X POST http://localhost:3000/api/settings/connections/invalid_id/test

# Test with missing connection
curl http://localhost:3000/api/settings/connections/nonexistent
```

### 9. Logging System
- [ ] Connection test logs captured
- [ ] Error logs written to file storage
- [ ] API logs include timestamps
- [ ] Trade engine logs include status updates
- [ ] System logger accessible

**Verify:**
```bash
cat logs/system.log
cat logs/api.log
```

### 10. Auto-Start System
- [ ] initializeTradeEngineAutoStart() called on app start
- [ ] Connection monitoring started
- [ ] Enabled connections auto-started
- [ ] Failed starts logged properly
- [ ] Restart monitoring active

**Verify in browser console:**
```javascript
// Check if auto-start ran
localStorage.getItem("cts_autostart_timestamp")
```

### 11. System Health
- [ ] No console errors on app load
- [ ] No unhandled promise rejections
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] Database connections not leaking

**Verify with:**
```bash
curl http://localhost:3000/api/system/verify-startup
curl http://localhost:3000/api/monitoring/comprehensive
```

### 12. Database Functionality
- [ ] Can save connections
- [ ] Can load connections
- [ ] Can update connections
- [ ] Can delete connections
- [ ] Data persists across restarts
- [ ] No data corruption

**Verify with:**
```bash
# Check file storage
ls -la data/
cat data/connections.json

# Restart app and verify data persists
npm run dev  # then stop
npm run dev  # restart
curl http://localhost:3000/api/settings/connections
```

## Deployment Verification

### Before Production Deploy
- [ ] All checklist items above passed
- [ ] Load test completed (100+ connections)
- [ ] Error scenarios tested
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Documentation reviewed

### Rollback Procedure
```bash
# If issues occur, rollback to previous version:
git revert [commit_hash]
npm install
npm run db:migrate
npm start
```

## Common Issues & Solutions

### Issue: Trade engine won't start
**Solution:**
1. Check database connection
2. Verify coordinator initialized: `curl http://localhost:3000/api/trade-engine/health`
3. Check error logs: `cat logs/error.log`
4. Restart application

### Issue: Connection test fails
**Solution:**
1. Verify API credentials in settings
2. Check exchange API endpoint accessible
3. Check network connectivity
4. Try testnet mode first

### Issue: Settings not saving
**Solution:**
1. Check database permissions
2. Verify file storage writable
3. Check browser console for errors
4. Try clearing browser cache

### Issue: UI not updating
**Solution:**
1. Check browser console for JavaScript errors
2. Verify API endpoints responding
3. Check network tab in DevTools
4. Restart development server

## Performance Benchmarks

Expected performance metrics:

- API response time: <200ms
- Connection test: 1-5 seconds
- Engine startup: <500ms
- UI render time: <100ms
- Database query: <50ms

If metrics worse than expected:
1. Check system resources
2. Review database indexes
3. Profile with Chrome DevTools
4. Check for memory leaks

## Final Sign-Off

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Ready for production

**Signed off by:** _______________  
**Date:** _______________
