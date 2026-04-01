# Manual Migration Execution Guide

## Automatic Migration Execution

When the app starts, migrations run automatically in this order:

1. Database file created if missing
2. Migrations table initialized
3. All pending migrations from `/scripts` execute
4. Each migration is logged in the migrations table
5. Failed migrations stop the process and log errors

## Manual Execution (If Needed)

### Via the Migration Runner (Recommended)

The migration runner is built into the app and runs automatically:

```typescript
import { runMigrations } from '@/lib/migration-runner'

await runMigrations()
// Outputs: [v0] Database migrations completed: X new migration(s) executed
```

### Via the Initialization Coordinator

For comprehensive database setup:

```typescript
import { executeCompleteInitialization } from '@/lib/db-initialization-coordinator'

const result = await executeCompleteInitialization()
console.log(result)
// Returns: { success: true, duration: 1234, details: {...} }
```

### Via the API Route

```bash
curl -X POST http://localhost:3000/api/install/initialize

# Response includes:
# - Tables created
# - Indexes created
# - Pragmas applied
# - Total duration
```

## New Migrations (101 & 102)

### Migration 101: SQLite Optimization

**File**: `/scripts/101_sqlite_comprehensive_optimization.sql`

**Purpose**: Apply performance PRAGMA settings

**Contents**:
- Journal mode: WAL
- Foreign keys: ON
- Synchronous: NORMAL
- Cache size: 64MB
- Memory-mapped I/O: 30MB
- Auto-vacuum: INCREMENTAL
- WAL autocheckpoint: 1000 pages
- Automatic index creation: ON
- Busy timeout: 30 seconds
- ANALYZE for query optimization

**Execution**: Automatic on first app start

**Status Table**: `pragma_optimization_log`

### Migration 102: SQLite Indexes

**File**: `/scripts/102_sqlite_optimized_indexes.sql`

**Purpose**: Create performance indexes for common queries

**Contains**:
- 30+ specialized indexes
- Partial indexes with WHERE clauses
- Time-series optimizations
- Active status optimizations
- Bulk operation indexes

**Execution**: Automatic after migration 101

**Verification**: Check `sqlite_master` table for index count

## Monitoring Migration Execution

### Check Executed Migrations

```sql
SELECT * FROM migrations ORDER BY executedAt DESC;
```

### Verify Optimization Applied

```sql
-- Check WAL mode
PRAGMA journal_mode;
-- Result: wal

-- Check cache size
PRAGMA cache_size;
-- Result: -64000

-- Check mmap size
PRAGMA mmap_size;
-- Result: 30000000
```

### Count Indexes

```sql
SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';
-- Before 102: ~15
-- After 102: ~45
```

## Troubleshooting Migrations

### Migration Fails to Execute

1. Check logs for error message
2. Verify SQL syntax (use `sqlite3` CLI)
3. Ensure tables exist (if migration depends on them)
4. Check for type mismatches or constraints

### PRAGMA Settings Not Applied

1. Verify migration 101 executed (check `migrations` table)
2. Run `PRAGMA journal_mode;` to verify current mode
3. Some PRAGMAs require closed connections to take effect
4. Restart app if settings weren't applied

### Indexes Not Created

1. Check migration 102 in `migrations` table
2. Run index count query above
3. Verify table names haven't changed
4. Check for missing tables (migration will skip if table missing)

### Re-run a Migration

Currently migrations only run once. To re-run:

1. Delete the row from `migrations` table:
```sql
DELETE FROM migrations WHERE id = '101_sqlite_comprehensive_optimization';
```

2. Restart the app
3. Migration will execute again

## Database File Locations

### Development
```
/data/database.db
/data/database.db-wal (Write-Ahead Log)
/data/database.db-shm (Shared Memory)
```

### Custom Location
Set environment variable:
```bash
DB_PATH=/path/to/custom/database.db
```

## Performance Baseline

After all migrations complete:

### Expected Database Size
- Empty: 50-100 KB
- With data: Variable (see PRAGMA analysis)

### Expected Query Times
- Connection lookup: 1-2ms
- Trade data retrieval: 5-10ms
- Bulk insert (1000 records): 100-200ms
- Index scan: 2-5ms

### Expected Indexes
- ~45 named indexes
- ~30+ composite indexes
- ~10+ partial indexes

## Rollback Strategy

SQLite doesn't have built-in rollback like Postgres. To rollback:

1. Keep backup of `database.db` before migrations
2. Delete migrations table entries if needed
3. Delete affected tables and re-run migrations
4. Or restore from backup

Example:
```sql
-- Remove migration record
DELETE FROM migrations WHERE id = '102_sqlite_optimized_indexes';

-- Drop indexes manually (only if needed)
DROP INDEX IF EXISTS idx_connections_active_fast;
```

## Performance Monitoring Post-Migration

After migrations execute, monitor:

```sql
-- Database file size
SELECT file_size FROM pragma_database_size;

-- Page count
PRAGMA page_count;

-- Free pages
PRAGMA freelist_count;

-- Stats table row count
SELECT COUNT(*) FROM sqlite_stat1;
```

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development first
3. **Monitor logs** during startup
4. **Verify PRAGMAs** after app starts
5. **Check indexes** are being used (EXPLAIN QUERY PLAN)
6. **Run VACUUM** periodically (offline)
7. **Monitor file size** growth over time

---

**All migrations run automatically on app startup.**
**No manual intervention required in normal operation.**
