-- Create exchange_connections table for managing exchange API connections
-- FIXED: Standardized schema to match app expectations (TEXT primary key, no user FK)

CREATE TABLE IF NOT EXISTS exchange_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_type TEXT DEFAULT 'spot',
  -- Added connection_method column for API connection type
  connection_method TEXT DEFAULT 'rest',
  api_key TEXT,
  api_secret TEXT,
  testnet INTEGER DEFAULT 0,
  -- Changed is_enabled to match database queries
  is_enabled INTEGER DEFAULT 1,
  -- Added is_active column for compatibility
  is_active INTEGER DEFAULT 1,
  -- Added is_live_trade column for live trading flag
  is_live_trade INTEGER DEFAULT 0,
  margin_type TEXT DEFAULT 'cross',
  position_mode TEXT DEFAULT 'hedge',
  volume_factor REAL DEFAULT 1.0,
  connection_library TEXT DEFAULT 'ccxt',
  is_predefined INTEGER DEFAULT 0,
  
  -- Removed JSON columns for SQLite compatibility, will be added later if PostgreSQL
  api_capabilities TEXT DEFAULT '{"spot": true, "futures": false, "margin": false}',
  rate_limits TEXT DEFAULT '{"requests_per_second": 10, "requests_per_minute": 600}',
  connection_settings TEXT DEFAULT '{}',
  
  connection_priority INTEGER DEFAULT 0,
  last_test_at TIMESTAMP,
  last_test_status TEXT,
  last_test_log TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_is_predefined ON exchange_connections(is_predefined);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_is_active ON exchange_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_is_enabled ON exchange_connections(is_enabled);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_priority ON exchange_connections(connection_priority);
