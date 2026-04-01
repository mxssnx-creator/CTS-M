-- Create tables for Auto Optimal feature
CREATE TABLE IF NOT EXISTS auto_optimal_configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Symbol Selection
  symbol_mode TEXT NOT NULL DEFAULT 'main',
  exchange_order_by TEXT NOT NULL DEFAULT 'price_change_24h',
  symbol_limit INTEGER NOT NULL DEFAULT 5,
  forced_symbols TEXT, -- JSON array of symbol strings (e.g., ["XAGUSD", "XAUUSD"])
  
  -- Indication Configuration
  indication_type TEXT,
  indication_params TEXT, -- JSON
  
  -- Position Ranges
  takeprofit_min REAL NOT NULL,
  takeprofit_max REAL NOT NULL,
  stoploss_min REAL NOT NULL,
  stoploss_max REAL NOT NULL,
  
  -- Trailing Options
  trailing_enabled INTEGER NOT NULL DEFAULT 0,
  trailing_only INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Filters
  min_profit_factor REAL NOT NULL DEFAULT 1.0,
  min_profit_factor_positions INTEGER NOT NULL DEFAULT 25,
  max_drawdown_time_hours REAL NOT NULL DEFAULT 10,
  
  -- Additional Strategies
  use_block INTEGER NOT NULL DEFAULT 0,
  use_dca INTEGER NOT NULL DEFAULT 0,
  additional_strategies_only INTEGER NOT NULL DEFAULT 0,
  
  -- Auto deactivation settings
  block_auto_deactivate_threshold INTEGER NOT NULL DEFAULT 25,
  block_reactivate_threshold INTEGER NOT NULL DEFAULT 40,
  dca_auto_deactivate_threshold INTEGER NOT NULL DEFAULT 25,
  dca_reactivate_threshold INTEGER NOT NULL DEFAULT 40,
  
  -- Calculation Settings
  calculation_days INTEGER NOT NULL DEFAULT 3,
  max_positions_per_direction INTEGER NOT NULL DEFAULT 3,
  max_positions_per_symbol INTEGER NOT NULL DEFAULT 3,
  
  -- Metadata
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auto_optimal_results (
  id TEXT PRIMARY KEY,
  configuration_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  
  -- Configuration Used
  indication_type TEXT,
  indication_params TEXT, -- JSON
  takeprofit REAL NOT NULL,
  stoploss REAL NOT NULL,
  trailing_enabled INTEGER NOT NULL DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  
  -- Strategy Configuration
  uses_block INTEGER NOT NULL DEFAULT 0,
  uses_dca INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Metrics
  profit_factor REAL NOT NULL,
  profit_factor_last_8 REAL NOT NULL,
  profit_factor_last_25 REAL NOT NULL,
  profit_factor_last_50 REAL NOT NULL,
  win_rate REAL NOT NULL,
  total_trades INTEGER NOT NULL,
  positions_per_24h REAL NOT NULL,
  max_drawdown_time_hours REAL NOT NULL,
  
  -- Trade Details
  avg_profit REAL NOT NULL,
  avg_loss REAL NOT NULL,
  max_profit REAL NOT NULL,
  max_loss REAL NOT NULL,
  total_profit REAL NOT NULL,
  total_loss REAL NOT NULL,
  
  -- Validation
  is_valid INTEGER NOT NULL DEFAULT 1,
  validation_reason TEXT,
  
  -- Metadata
  calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (configuration_id) REFERENCES auto_optimal_configurations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auto_optimal_results_config ON auto_optimal_results(configuration_id);
CREATE INDEX IF NOT EXISTS idx_auto_optimal_results_symbol ON auto_optimal_results(symbol);
CREATE INDEX IF NOT EXISTS idx_auto_optimal_results_profit_factor ON auto_optimal_results(profit_factor DESC);

CREATE TABLE IF NOT EXISTS auto_optimal_saved_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  configuration_id TEXT NOT NULL,
  
  -- Additional Settings
  volume_factor_ratio REAL NOT NULL DEFAULT 1.0,
  min_profit_factor REAL NOT NULL DEFAULT 1.0,
  max_drawdown_time_hours REAL NOT NULL DEFAULT 10,
  use_block INTEGER NOT NULL DEFAULT 0,
  use_dca INTEGER NOT NULL DEFAULT 0,
  
  -- Selected Results (JSON array of result IDs)
  selected_results TEXT NOT NULL,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (configuration_id) REFERENCES auto_optimal_configurations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auto_optimal_saved_sets_config ON auto_optimal_saved_sets(configuration_id);
