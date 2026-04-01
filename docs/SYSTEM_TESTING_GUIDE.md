# System Testing Guide - CTS v3.1

## Overview

This guide provides step-by-step testing procedures to verify the complete CTS v3.1 system.

## Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs at http://localhost:3000
```

## Test Suite 1: API Endpoints

### 1.1 Connection List API
```bash
# Test: Get all connections
curl http://localhost:3000/api/settings/connections

# Expected: Array of connections or empty array
# Status: 200 OK

# Test: Filter by exchange
curl "http://localhost:3000/api/settings/connections?exchange=bybit"

# Expected: Only Bybit connections
# Status: 200 OK
```

### 1.2 Connection Creation API
```bash
# Test: Create new connection
curl -X POST http://localhost:3000/api/settings/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Connection",
    "exchange": "bybit",
    "api_type": "perpetual_futures",
    "connection_method": "library",
    "api_key": "test_key_123",
    "api_secret": "test_secret_456",
    "margin_type": "cross",
    "position_mode": "hedge",
    "is_testnet": true
  }'

# Expected: Connection created with ID
# Status: 200/201
```

### 1.3 Connection Test API
```bash
# Test: Test single connection
curl -X POST http://localhost:3000/api/settings/connections/{id}/test

# Expected: Test logs with balance info
# Status: 200 or 500 with logs

# Test: Batch test multiple connections
curl -X POST http://localhost:3000/api/settings/connections/batch-test \
  -H "Content-Type: application/json" \
  -d '{"testAllConnections": true}'

# Expected: Results for all connections
# Status: 200
```

### 1.4 Connection Health API
```bash
# Test: Get connection health
curl http://localhost:3000/api/settings/connections/health

# Expected: Health status for all connections
# Status: 200
```

## Test Suite 2: Trade Engine APIs

### 2.1 Start Engine
```bash
# Test: Start trade engine
curl -X POST http://localhost:3000/api/trade-engine/start \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "your_connection_id"}'

# Expected: Engine started with ID
# Status: 200
```

### 2.2 Engine Status
```bash
# Test: Get single engine status
curl http://localhost:3000/api/trade-engine/status/{engineId}

# Expected: Engine status details
# Status: 200

# Test: Get all engine statuses
curl http://localhost:3000/api/trade-engine/status-all

# Expected: Array of all engines
# Status: 200
```

### 2.3 Stop Engine
```bash
# Test: Stop trade engine
curl -X POST http://localhost:3000/api/trade-engine/stop \
  -H "Content-Type: application/json" \
  -d '{"engineId": "your_engine_id"}'

# Expected: Engine stopped
# Status: 200
```

## Test Suite 3: System APIs

### 3.1 System Status
```bash
# Test: Get system status
curl http://localhost:3000/api/system/status

# Expected: System status with all metrics
# Status: 200
```

### 3.2 Integration Test
```bash
# Test: Run full integration test
curl -X POST http://localhost:3000/api/system/integration-test

# Expected: Test results for all connections
# Status: 200

# Test: Run integration test for specific connections
curl -X POST http://localhost:3000/api/system/integration-test \
  -H "Content-Type: application/json" \
  -d '{"connectionIds": ["id1", "id2"]}'

# Expected: Test results for selected connections
# Status: 200
```

### 3.3 API Verification
```bash
# Test: Verify all APIs
curl http://localhost:3000/api/system/verify-apis

# Expected: Response times for all endpoints
# Status: 200
```

## Test Suite 4: UI Components

### 4.1 Settings Page
1. Navigate to http://localhost:3000/settings
2. Verify the following:
   - [ ] Connection list displays
   - [ ] Add Custom button visible
   - [ ] Connection cards show status
   - [ ] Edit button opens dialog
   - [ ] Delete button works
   - [ ] Test button executes test

### 4.2 Add Connection Dialog
1. Click "Add Custom" button
2. Verify:
   - [ ] Dialog opens with form
   - [ ] All fields are present
   - [ ] Form validates correctly
   - [ ] Submit creates connection
   - [ ] Cancel closes dialog

### 4.3 Edit Connection Dialog
1. Click edit button on connection card
2. Verify:
   - [ ] Dialog shows current values
   - [ ] Fields are editable
   - [ ] Submit updates connection
   - [ ] Validation prevents bad input

### 4.4 Connection Card
1. Find a connection in list
2. Verify:
   - [ ] Name displays
   - [ ] Exchange badge shows
   - [ ] Status shows (if tested)
   - [ ] Test logs expandable
   - [ ] Balance displays

### 4.5 Live Trading Page
1. Navigate to http://localhost:3000/live-trading
2. Verify:
   - [ ] Connection selector available
   - [ ] Start button works
   - [ ] Status updates in real-time
   - [ ] Stop button functional

## Test Suite 5: Rate Limiting

### 5.1 Rate Limit Enforcement
```bash
# Create multiple connections
# Rapidly call test endpoint
# Verify: No rate limit errors

# Run batch test
# Verify: Batch processor respects limits
```

### 5.2 Batch Processing
```bash
# Batch test 10 connections
# Verify: Completes without errors
# Check: Respects per-exchange limits
```

## Test Suite 6: Error Handling

### 6.1 Invalid Input
```bash
# Test: Invalid connection ID
curl http://localhost:3000/api/settings/connections/invalid_id

# Expected: 404 error

# Test: Missing required fields
curl -X POST http://localhost:3000/api/settings/connections \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: Validation error
```

### 6.2 Network Errors
```bash
# Test: Invalid API credentials
# Create connection with wrong credentials
# Run test
# Expected: User-friendly error message
```

### 6.3 Rate Limit Errors
```bash
# Test: Rapid consecutive requests
# Expected: Proper error handling
# Check: Logging captures event
```

## Test Suite 7: Logging & Monitoring

### 7.1 Check Logs
1. Open browser console (F12)
2. Check for:
   - [ ] [v0] messages for operations
   - [ ] No error messages
   - [ ] Proper log formatting

### 7.2 Server Logs
1. Check terminal where `npm run dev` runs
2. Verify:
   - [ ] API calls logged
   - [ ] No error stacktraces
   - [ ] Performance metrics shown

## Test Suite 8: Performance

### 8.1 Response Times
```bash
# Measure API response times
time curl http://localhost:3000/api/settings/connections

# Expected: < 100ms for GET
# Expected: < 200ms for POST

# Connection test
time curl -X POST http://localhost:3000/api/settings/connections/{id}/test

# Expected: 2-5 seconds
```

### 8.2 Memory Usage
```bash
# Monitor memory during batch operations
# Expected: No continuous growth
# Expected: < 200MB total
```

## Test Suite 9: Data Persistence

### 9.1 Connection Persistence
```bash
# Create a connection
# Restart server (Ctrl+C, npm run dev)
# Verify: Connection still exists
```

### 9.2 Atomic Updates
```bash
# Create multiple connections
# Update all simultaneously
# Verify: No data corruption
```

## Test Suite 10: Complete Workflow

### 10.1 End-to-End Test
1. [ ] Start with empty connection list
2. [ ] Add new connection via UI
3. [ ] Test connection
4. [ ] Verify logs display correctly
5. [ ] Edit connection
6. [ ] Delete connection
7. [ ] Verify deletion successful

### 10.2 Trading Workflow
1. [ ] Create test connection
2. [ ] Navigate to live trading
3. [ ] Start engine
4. [ ] Monitor status
5. [ ] View metrics
6. [ ] Stop engine
7. [ ] Verify stop successful

## Test Results Template

```
Date: _________
Tester: _________
Build: _________

Test Suite 1: API Endpoints
- Connection List: [ ] PASS [ ] FAIL
- Connection Create: [ ] PASS [ ] FAIL
- Connection Test: [ ] PASS [ ] FAIL
- Batch Test: [ ] PASS [ ] FAIL
- Health Check: [ ] PASS [ ] FAIL

Test Suite 2: Trade Engine
- Start Engine: [ ] PASS [ ] FAIL
- Engine Status: [ ] PASS [ ] FAIL
- Stop Engine: [ ] PASS [ ] FAIL

Test Suite 3: System
- System Status: [ ] PASS [ ] FAIL
- Integration Test: [ ] PASS [ ] FAIL
- API Verification: [ ] PASS [ ] FAIL

Test Suite 4: UI Components
- Settings Page: [ ] PASS [ ] FAIL
- Add Dialog: [ ] PASS [ ] FAIL
- Edit Dialog: [ ] PASS [ ] FAIL
- Connection Card: [ ] PASS [ ] FAIL
- Live Trading: [ ] PASS [ ] FAIL

Test Suite 5: Rate Limiting
- Enforcement: [ ] PASS [ ] FAIL
- Batch Processing: [ ] PASS [ ] FAIL

Test Suite 6: Error Handling
- Invalid Input: [ ] PASS [ ] FAIL
- Network Errors: [ ] PASS [ ] FAIL
- Rate Limits: [ ] PASS [ ] FAIL

Test Suite 7: Logging
- Browser Logs: [ ] PASS [ ] FAIL
- Server Logs: [ ] PASS [ ] FAIL

Test Suite 8: Performance
- Response Times: [ ] PASS [ ] FAIL
- Memory Usage: [ ] PASS [ ] FAIL

Test Suite 9: Persistence
- Connection Data: [ ] PASS [ ] FAIL
- Atomic Updates: [ ] PASS [ ] FAIL

Test Suite 10: Workflows
- Connection Workflow: [ ] PASS [ ] FAIL
- Trading Workflow: [ ] PASS [ ] FAIL

OVERALL: [ ] PASS [ ] FAIL

Notes:
_________________________________________
_________________________________________
```

## Quick Test Commands

```bash
# All endpoints quick test
./test-all.sh  # (if script exists)

# Individual component test
npm run test

# Build test
npm run build

# Lint test
npm run lint
```

## Success Criteria

All tests pass when:
- ✓ All API endpoints respond correctly
- ✓ All UI components render properly
- ✓ Error handling is comprehensive
- ✓ Rate limiting works correctly
- ✓ Batch processing is efficient
- ✓ Performance meets targets
- ✓ Logging captures all events
- ✓ Data persists correctly
- ✓ Workflows complete end-to-end

## Next Steps

1. Run all test suites
2. Document any failures
3. Fix issues if found
4. Re-run tests
5. Get approval for deployment
