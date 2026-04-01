# Settings Connection Architecture Coordination

## System Separation

### Base Connection (Settings/Overall/Connection)
**Purpose**: API/Connection configuration ONLY - No trade settings

**Responsibilities**:
- Exchange API credentials (key, secret, passphrase)
- Connection method (REST, WebSocket)
- Connection library selection  
- API type (spot, futures, margin)
- Testnet/Mainnet selection
- Margin type (cross, isolated)
- Position mode (hedge, one-way)
- Rate limiting configuration
- Connection testing

**NOT Responsible For**:
- ❌ Trade volume factors
- ❌ Preset type assignments
- ❌ Strategy configurations
- ❌ Active trading settings

### Active Connections (Settings/Exchange & Dashboard)
**Purpose**: Trading configuration and active connection management

**Responsibilities**:
- Select active connection for trading
- Configure trade volume factors (live, preset)
- Symbol selection and configuration
- Preset type assignments
- Enable/disable trading modes
- Synchronized across Dashboard and Settings/Exchange

**Data Flow**:
\`\`\`
Base Connection (API Config)
    ↓
Active Connection (Selected for Trading)
    ↓
Trade Volume Factors + Strategy Settings
    ↓
Live Trading Execution
\`\`\`

## Database Schema

### `connections` table
- `id` - Connection identifier
- `name` - User-defined name
- `exchange` - Exchange name
- `exchange_id` - Exchange enum ID
- `api_key`, `api_secret`, `passphrase` - Credentials
- `api_type` - spot/futures/margin
- `connection_method` - REST/WebSocket
- `connection_library` - Library selection
- `margin_type` - cross/isolated
- `position_mode` - hedge/one-way
- `is_testnet` - Boolean
- `is_enabled` - Base enabled status
- `is_active` - Currently active for trading
- `preset_type_id` - Linked preset strategy (nullable)
- `connection_settings` - JSON blob for extended settings
- `last_test_status`, `last_test_balance`, `last_test_log` - Test results

### `connection_settings` table (per connection)
- `connection_id` - FK to connections
- `baseVolumeFactor` - Default volume factor
- `baseVolumeFactorLive` - Live trading volume
- `baseVolumeFactorPreset` - Preset trading volume
- `volumeRangePercentage` - Volume variance
- `targetPositions` - Target position count

## File Coordination

### Text Files for State Tracking
- `ACTIVE_CONNECTION_STATE.txt` - Current active connection ID
- `CONNECTION_SYNC_LOG.txt` - Sync events between Dashboard/Settings
- `CONNECTION_TEST_RESULTS.txt` - Latest test results cache
- `VOLUME_FACTOR_CACHE.txt` - Volume factor configurations

### Benefits of Text File Coordination:
1. **Fast reads** - No database queries for UI state
2. **Change detection** - File watchers for real-time sync
3. **Debugging** - Human-readable state inspection
4. **Backup** - Git-trackable configuration history
5. **Performance** - Reduced database load

## Button Functionality Matrix

### Base Connection Card Buttons

| Button | Action | API Endpoint | Toast Message | Confirmation |
|--------|--------|--------------|---------------|--------------|
| **API Settings** | Edit credentials | `PATCH /api/settings/connections/:id` | "Connection updated" | No |
| **Test Connection** | Verify API | `POST /api/settings/connections/:id/test` | "Balance: $X.XX" / "Failed" | No |
| **Enable/Disable** | Toggle enabled | `POST /api/settings/connections/:id/toggle` | "Connection enabled/disabled" | No |
| **Delete** | Remove connection | `DELETE /api/settings/connections/:id` | "Connection deleted" | **Yes** |
| **Settings** | Open settings dialog | Opens `ConnectionSettingsDialog` | N/A | No |
| **Information** | View connection info | Opens `ConnectionInfoDialog` | N/A | No |
| **Connection Log** | View test logs | Opens `ConnectionLogDialog` | N/A | No |

### Active Connection Buttons (Settings/Exchange)

| Button | Action | API Endpoint | Toast Message |
|--------|--------|--------------|---------------|
| **Select Connection** | Set active | Updates state + file | "Active connection changed" |
| **Load Symbols** | Fetch symbols | `GET /api/exchanges/:id/symbols` | "Loaded X symbols" |
| **Update Volume** | Set trade volume | `PATCH /api/settings/connections/:id/settings` | "Volume factor updated" |

## Synchronization Logic

### Dashboard ↔ Settings/Exchange Sync

\`\`\`typescript
// When Dashboard changes active connection:
1. Update `ACTIVE_CONNECTION_STATE.txt`
2. Broadcast event via EventEmitter
3. Settings/Exchange detects file change
4. Updates UI selector automatically

// When Settings/Exchange changes active connection:
1. Update `ACTIVE_CONNECTION_STATE.txt`
2. Broadcast event via EventEmitter  
3. Dashboard detects file change
4. Updates header selector automatically
\`\`\`

### Implementation Pattern:
\`\`\`typescript
// File watcher setup
const watcher = fs.watch('ACTIVE_CONNECTION_STATE.txt', (eventType) => {
  if (eventType === 'change') {
    const newActiveId = fs.readFileSync('ACTIVE_CONNECTION_STATE.txt', 'utf-8')
    setActiveConnection(newActiveId)
    toast.info('Active connection synchronized')
  }
})
\`\`\`

## Production Checklist

- [x] Remove trade-related buttons from Base Connection cards
- [x] Move volume factors to Active Connections section
- [x] Add active connection selector to Settings/Exchange
- [x] Synchronize Dashboard ↔ Settings/Exchange
- [x] Implement text file coordination
- [x] Add confirmation dialogs for destructive actions
- [x] Comprehensive toast messages for all actions
- [x] Error handling with retry capability
- [x] Loading states for all async operations
- [x] Validate all API endpoints functional
- [x] Test connection sync across tabs
- [x] Performance optimization with caching

## Error Handling Strategy

### Connection Errors
\`\`\`typescript
try {
  const result = await testConnection(id)
  toast.success(`Connection successful! Balance: $${result.balance}`)
  updateTextFile('CONNECTION_TEST_RESULTS.txt', result)
} catch (error) {
  toast.error(error.message)
  logToFile('CONNECTION_SYNC_LOG.txt', { type: 'test_error', error, timestamp })
  // Show retry button in UI
}
\`\`\`

### Sync Errors
- Automatic retry with exponential backoff
- Fallback to database if text file unavailable
- User notification with resolution steps
- Detailed logging for debugging

## Performance Metrics

### Target Performance:
- Connection list load: < 200ms
- Active connection switch: < 50ms  
- Volume factor update: < 100ms
- Dashboard/Settings sync: < 30ms
- Text file read: < 5ms

### Optimization Techniques:
1. Text file caching for UI state
2. Debounced database writes
3. Optimistic UI updates
4. Batch API requests
5. Connection pooling for frequent operations
