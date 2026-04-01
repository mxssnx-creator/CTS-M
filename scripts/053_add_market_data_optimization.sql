-- Market Data Optimization: Add time-based indexes, limits, and cleanup
-- Performance improvements for indication calculations with prehistoric data management

-- Add composite indexes for time-range queries
CREATE INDEX IF NOT EXISTS idx_market_data_connection_symbol_time 
  ON market_data(connection_id, symbol, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time_price 
  ON market_data(symbol, timestamp DESC, price);

CREATE INDEX IF NOT EXISTS idx_market_data_connection_time 
  ON market_data(connection_id, timestamp DESC);

-- Add index on indication_states for cleanup
CREATE INDEX IF NOT EXISTS idx_indication_states_validated 
  ON indication_states(validated_at);

-- Add index on pseudo_positions for time-based queries
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_created 
  ON pseudo_positions(connection_id, symbol, created_at DESC);

-- Add index on pseudo_positions for status and time
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_status_time 
  ON pseudo_positions(connection_id, status, created_at DESC);

-- Add data retention settings
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('marketDataRetentionDays', '7', 'Number of days to keep market data (older data will be archived)', 'performance'),
  ('indicationStateRetentionHours', '48', 'Number of hours to keep indication states (older states will be cleaned)', 'performance'),
  ('marketDataQueryMaxMinutes', '60', 'Maximum minutes to fetch in a single market data query', 'performance'),
  ('enableAutoCleanup', 'true', 'Automatically cleanup old data based on retention settings', 'performance'),
  ('cleanupIntervalHours', '24', 'How often to run automatic cleanup (in hours)', 'performance')
ON CONFLICT (key) DO NOTHING;

-- Create archived_market_data table for historical data
CREATE TABLE IF NOT EXISTS archived_market_data (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  volume NUMERIC(20, 8),
  timestamp TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for archived data
  INDEX idx_archived_connection_symbol (connection_id, symbol),
  INDEX idx_archived_timestamp (timestamp DESC)
);

-- Create cleanup log table
CREATE TABLE IF NOT EXISTS data_cleanup_log (
  id SERIAL PRIMARY KEY,
  cleanup_type TEXT NOT NULL, -- 'market_data', 'indication_states', etc.
  records_cleaned INTEGER NOT NULL,
  records_archived INTEGER,
  cleanup_started_at TIMESTAMP NOT NULL,
  cleanup_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL, -- 'success', 'partial', 'failed'
  error_message TEXT,
  
  INDEX idx_cleanup_log_time (cleanup_completed_at DESC),
  INDEX idx_cleanup_log_type (cleanup_type)
);
