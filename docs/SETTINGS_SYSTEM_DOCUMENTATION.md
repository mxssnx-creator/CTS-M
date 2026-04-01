# Settings System Comprehensive Documentation

## Overview
Complete documentation for the CTS v3.1 Settings system covering all functionality, coordinations, and production-ready features.

---

## 1. Settings/System Tab

### Database Configuration
- **Database Type Selection**
  - SQLite (Local) - Default for development
  - PostgreSQL (Local) - Local PostgreSQL instance
  - PostgreSQL (Remote) - Remote PostgreSQL (Vercel/production)
  
- **Configuration Process**
  1. Select database type from dropdown
  2. System saves preference to `/data/db-config.json`
  3. Confirmation dialog warns about restart requirement
  4. Page reloads to apply new database type
  
- **Database Type Recovery**
  - Old database type info preserved in `/data/db-config.json`
  - Automatic detection on startup from `DATABASE_URL` env var
  - Fallback to SQLite if no configuration found

---

## 2. Settings/Overall/Connection Tab

### Base Connection Management
**Purpose**: API and Connection settings ONLY (not trade settings)

**Connection Card Features**:
- **Test Connection** - Validates API credentials
- **Connection Log** - Shows connection history and events
- **API Settings** - Edit API keys and connection parameters
- **Enable/Disable Toggle** - Enable or disable connection
- **Delete Button** - Remove connection (with confirmation)

**Removed Features** (moved to Active Connections):
- ❌ Information Button (trade/position info)
- ❌ Volume Factor Configuration
- ❌ Trade Settings

**Connection Card Data**:
- Connection Name
- Exchange Type (Binance, Bybit, etc.)
- API Type (REST, WebSocket)
- Connection Method (HTTPS, WSS)
- Margin Type (Cross, Isolated)
- Position Mode (One-way, Hedge)
- Testnet/Mainnet Status
- Last Test Balance (if tested)

---

## 3. Settings/Exchange Tab

### Active Connection Selection
**Synchronized with Dashboard**

**Features**:
- Dropdown showing all ENABLED connections
- Real-time sync with Dashboard selection
- Persists selection to localStorage: `activeExchangeConnection`
- Shows connection status (Active/Inactive)
- Displays exchange type and network (Testnet/Mainnet)

**Selection Flow**:
1. User selects connection from dropdown
2. Selection saved to localStorage
3. Toast notification confirms selection
4. Dashboard automatically syncs to same selection
5. All trading operations use selected connection

**Connection Display**:
\`\`\`
● Connection Name (Exchange)
  Binance • Mainnet
  Status: Active
\`\`\`

**Empty State**:
- Shows "No enabled connections available"
- Prompts user to enable connections in Settings/Overall/Connection

---

## 4. Settings/Overall/Install Tab

### Database Operations
**All operations work with both SQLite and PostgreSQL**

**Database Setup**:
- Initialize Database - Creates all tables and schemas
- Run Migrations - Applies pending migrations
- Reset Database - Drops all tables and recreates (with confirmation)

**System Diagnostics**:
- System Information - Platform, Node version, memory, CPU
- Check Dependencies - Verifies all npm packages installed
- Run Diagnostics - Comprehensive system health check

**Backup & Restore**:
- Create Backup - Manual backup with custom name
- List Backups - Shows all available backups
- Restore Backup - Restore from backup (with confirmation)
- Download Backup - Download backup as ZIP
- Delete Backup - Remove backup (with confirmation)

**Deployment**:
- Export Configuration - Export all settings as JSON
- Import Configuration - Import settings from JSON
- Download Deployment - Complete deployment package
- Remote Install - SSH-based remote deployment

---

## 5. Save Settings Button

### Functionality
Located at top-right of all Settings tabs

**Save Process**:
1. Validates all settings changes
2. Compares with previous settings to detect critical changes
3. If database sizes or engine intervals changed:
   - Pauses trade engine
   - Shows "Pausing trade engine..." toast
   - Waits 2 seconds for engine to stop
4. Saves settings to database
5. Shows "Settings saved!" toast ✓
6. If database sizes changed:
   - Reorganizes database with new limits
   - Shows "Database reorganized successfully" toast
7. If critical changes made:
   - Resumes trade engine
   - Shows "Trade engine resumed" toast
   - Reloads page after 2 seconds

**Toast Messages**:
- ✓ "Saving settings..." - Initial save start
- ✓ "Pausing trade engine..." - Engine pause (if needed)
- ✓ "Settings saved!" - Save successful
- ✓ "Database reorganized successfully" - Size limits applied
- ✓ "Trade engine resumed" - Engine restarted
- ✓ "Applying all changes..." - Page reload imminent
- ✗ "Error saving settings" - Save failed
- ✗ "Database reorganization failed" - Limits not applied
- ✗ "Failed to resume trade engine" - Engine restart failed

---

## 6. Database Migrations

### Dual Database Support
All migrations support both SQLite and PostgreSQL

**Migration System**:
- Migrations stored in `/scripts` folder
- Named format: `0XX_migration_name.sql`
- Executed in order by ID
- Tracks executed migrations in `schema_migrations` table

**SQLite Specifics**:
- Uses `?` placeholders
- `INTEGER PRIMARY KEY AUTOINCREMENT`
- `DATETIME DEFAULT CURRENT_TIMESTAMP`

**PostgreSQL Specifics**:
- Uses `$1, $2, $3` placeholders
- `SERIAL PRIMARY KEY`
- `TIMESTAMP DEFAULT NOW()`
- Supports advanced features (JSON, Array types)

**Migration Functions**:
- `isMigrationExecuted()` - Checks if migration already run
- `markMigrationExecuted()` - Records migration completion
- `runPendingMigrations()` - Runs all pending migrations

---

## 7. Coordination Files

### Text File Coordination System
Enables fast synchronization between components without database queries

**Active Files**:
- `/data/active-connection.txt` - Currently active connection ID
- `/data/active-preset.txt` - Currently active preset ID
- `/data/db-config.json` - Database type preference
- `/data/sync-timestamp.txt` - Last sync timestamp

**Usage**:
\`\`\`typescript
// Read active connection
const connectionId = fs.readFileSync('/data/active-connection.txt', 'utf-8')

// Write active connection
fs.writeFileSync('/data/active-connection.txt', connectionId)

// Check sync
const lastSync = fs.readFileSync('/data/sync-timestamp.txt', 'utf-8')
\`\`\`

---

## 8. Production Ready Checklist

### ✅ All Buttons Functional
- [x] Test Connection - Validates API
- [x] Delete Connection - With confirmation
- [x] API Settings - Opens edit dialog
- [x] Enable/Disable Toggle - Persists state
- [x] Connection Log - Shows history
- [x] Save Settings - All flows work
- [x] Database Operations - Init, Migrate, Reset
- [x] Backup Operations - Create, Restore, Download, Delete
- [x] Active Connection Select - Syncs with Dashboard

### ✅ Toast Messages Working
- [x] Save Settings success/error
- [x] Connection test success/error
- [x] Connection toggle success/error
- [x] Connection delete success/error
- [x] Database operations success/error
- [x] Active connection selection confirmation

### ✅ Confirmations
- [x] Delete connection
- [x] Reset database
- [x] Restore backup
- [x] Delete backup
- [x] Change database type

### ✅ Data Persistence
- [x] Settings to database
- [x] Active connection to localStorage
- [x] Database type to config file
- [x] Sync coordination via text files

### ✅ Error Handling
- [x] Try-catch on all async operations
- [x] Error toasts with descriptive messages
- [x] Fallback behaviors
- [x] Engine resume on error

---

## 9. Architecture Clarifications

### Connection Types
1. **Base Connections** (Settings/Overall/Connection)
   - API credentials and connection parameters
   - Enable/disable status
   - Test connection functionality
   - NO trade settings

2. **Active Connections** (Settings/Exchange + Preset)
   - Trade configuration per connection
   - Volume factors and position limits
   - Symbol selection and filters
   - Built on top of Base Connections

### Volume Calculations
- **Base** = No volume calculations (averages & drawdown only)
- **Main** = Volume calculations ONLY for Adjust Strategies (DCA, Block)
- **Trailing** = Additional category (base logistics), not an Adjust Strategy
- **Real** = Validates Main, no new volume calculations
- **Exchange** = Mirrors executed trades, inherits volumes from Real

### System Flow
\`\`\`
User → Settings/Overall/Connection → Create Base Connection
     → Settings/Exchange → Select Active Connection
     → Configure Trade Settings
     → Dashboard → Sync Active Connection
     → Trade Engine → Execute with Active Connection
\`\`\`

---

## 10. Common Tasks

### Add New Exchange Connection
1. Go to Settings → Overall → Connection
2. Click "Add Connection"
3. Fill in API credentials
4. Select exchange type, margin, position mode
5. Test connection
6. Enable connection
7. Go to Settings → Exchange
8. Select connection in "Active Connection" dropdown
9. Configure trade settings

### Change Database Type
1. Go to Settings → System
2. Select new database type from dropdown
3. Confirm restart warning
4. Wait for page reload
5. Verify new database type active

### Backup Database
1. Go to Settings → Overall → Install
2. Navigate to "Backup" tab
3. Enter backup name
4. Click "Create Backup"
5. Wait for success message
6. Backup saved to `/data/backups/`

### Switch Active Connection
1. Go to Settings → Exchange OR Dashboard
2. Select connection from dropdown
3. Toast confirms selection
4. Selection synced across all pages

---

## 11. Troubleshooting

### Toast Messages Not Showing
- Check `useToast` hook imported
- Verify `toast()` function calls
- Check browser console for errors
- Ensure toaster component rendered in layout

### Active Connection Not Showing
- Verify connections exist in database
- Check connections are enabled (`is_enabled = true`)
- Verify localStorage key: `activeExchangeConnection`
- Check browser console for fetch errors

### Database Type Not Changing
- Verify `/data/db-config.json` writable
- Check `DATABASE_URL` environment variable
- Ensure proper permissions on data directory
- Check server logs for errors

### Save Settings Not Working
- Check network tab for API errors
- Verify `/api/settings` endpoint accessible
- Check database connection active
- Review server logs for details

---

End of Documentation
