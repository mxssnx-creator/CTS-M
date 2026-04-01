-- Create statistics tracking tables that match the statistics-tracker.ts queries
-- These are separate from position/strategy tracking tables for aggregated metrics

-- Indication statistics table - tracks indication evaluation metrics
CREATE TABLE IF NOT EXISTS indication_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL,
  confidence REAL,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_indication_stats_connection_time 
  ON indication_stats(connection_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indication_stats_type 
  ON indication_stats(connection_id, type, calculated_at DESC);

-- Strategy statistics table - tracks strategy evaluation metrics  
CREATE TABLE IF NOT EXISTS strategy_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  avg_profit_factor REAL DEFAULT 0,
  avg_drawdown_time INTEGER DEFAULT 0,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_strategy_stats_connection_time 
  ON strategy_stats(connection_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_stats_type 
  ON strategy_stats(connection_id, type, evaluated_at DESC);
