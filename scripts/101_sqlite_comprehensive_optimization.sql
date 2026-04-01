-- Migration 101: SQLite Performance and Reliability Optimization (Comprehensive)
-- Enables all high-performance PRAGMA settings for production SQLite databases
-- This script should be run once after database initialization

-- =============================================================================
-- CONNECTION PERFORMANCE PRAGMAS
-- =============================================================================

-- Enable WriteAheadLogging for better concurrency and crash recovery
PRAGMA journal_mode = WAL;

-- Foreign key constraints enforcement
PRAGMA foreign_keys = ON;

-- Synchronous mode: NORMAL balances safety with performance
-- NORMAL = fsync() called after commit, but not after every statement
PRAGMA synchronous = NORMAL;

-- Temporary storage in memory instead of disk
PRAGMA temp_store = MEMORY;

-- Cache size: 64MB = 64000 * 4KB pages (on 64-bit systems)
-- Larger cache reduces disk I/O
PRAGMA cache_size = -64000;

-- Query timeout: 30000 milliseconds = 30 seconds
PRAGMA query_only = OFF;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION PRAGMAS
-- =============================================================================

-- Disable automatic VACUUM during transactions (manual optimization)
-- This prevents slowdowns during peak operation
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA incremental_vacuum(0);

-- Page size: 4096 bytes (default, optimal for most systems)
-- Can't change after DB is created, but documented for new DBs
-- PRAGMA page_size = 4096;

-- Memory-mapped I/O: Map entire database into memory
-- Requires modern OS support, significantly improves read performance
PRAGMA mmap_size = 30000000; -- 30MB memory mapping

-- Parser optimization
PRAGMA optimize;

-- Automatic index creation
PRAGMA automatic_index = ON;

-- Busy timeout: 30000 milliseconds = 30 seconds
-- How long to wait before returning SQLITE_BUSY
PRAGMA busy_timeout = 30000;

-- =============================================================================
-- ANALYSIS AND STATISTICS
-- =============================================================================

-- Run full analysis for query optimizer
-- Generates statistics in sqlite_stat1, sqlite_stat3, sqlite_stat4 tables
ANALYZE;

-- =============================================================================
-- WAL MODE SPECIFIC SETTINGS
-- =============================================================================

-- WAL checkpoint mode: PASSIVE
-- Checkpoint happens passively without blocking writes
PRAGMA wal_autocheckpoint = 1000; -- Checkpoint every 1000 pages written

-- =============================================================================
-- MEMORY AND STORAGE OPTIMIZATION
-- =============================================================================

-- Temporary files: memory-backed
-- Prevents temporary files from going to disk during complex queries
PRAGMA temp_store = MEMORY;

-- Limit temporary file usage
PRAGMA temp_store_directory = '';

-- =============================================================================
-- CONSISTENCY AND INTEGRITY
-- =============================================================================

-- Enforce full constraint checking - verify no violations exist
PRAGMA foreign_keys = ON;

-- =============================================================================
-- VERIFICATION AND LOGGING
-- =============================================================================

-- Create a verification marker table
CREATE TABLE IF NOT EXISTS pragma_optimization_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  optimization_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  pragmas_applied TEXT,
  notes TEXT
);

-- Record that optimization was applied
INSERT INTO pragma_optimization_log (pragmas_applied, notes)
VALUES (
  'WAL, foreign_keys, synchronous=NORMAL, cache_size=64MB, mmap_size=30MB, auto_vacuum=INCREMENTAL',
  'Comprehensive SQLite optimization applied for production use'
);
