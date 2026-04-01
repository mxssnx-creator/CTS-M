-- Create tables for new Presets coordination system with Sets

-- Configuration Sets table - stores individual configuration sets
CREATE TABLE IF NOT EXISTS preset_configuration_sets (
  id VARCHAR(21) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Symbol Selection
  symbol_mode VARCHAR(50) DEFAULT 'main', -- 'main', 'forced', 'manual', 'exchange'
  symbols TEXT[], -- Manual symbols or selected symbols
  exchange_order_by VARCHAR(50), -- 'market_cap', 'volume', 'volatility', 'price_change'
  exchange_limit INTEGER DEFAULT 10,
  
  -- Indication Configuration
  indication_type VARCHAR(50) NOT NULL, -- 'rsi', 'macd', 'bollinger', 'sar', 'adx', etc.
  indication_params JSONB NOT NULL, -- Indicator-specific parameters with ranges
  
  -- Position Ranges
  takeprofit_min DECIMAL(10,2) DEFAULT 2.0,
  takeprofit_max DECIMAL(10,2) DEFAULT 30.0,
  takeprofit_step DECIMAL(10,2) DEFAULT 2.0,
  stoploss_min DECIMAL(10,2) DEFAULT 0.3,
  stoploss_max DECIMAL(10,2) DEFAULT 3.0,
  stoploss_step DECIMAL(10,2) DEFAULT 0.3,
  
  -- Trailing Configuration
  trailing_enabled BOOLEAN DEFAULT true,
  trail_starts DECIMAL(10,2)[] DEFAULT ARRAY[0.5, 1.0, 1.5],
  trail_stops DECIMAL(10,2)[] DEFAULT ARRAY[0.2, 0.4, 0.6],
  
  -- Calculation Settings
  range_days INTEGER DEFAULT 7, -- Previous days for calculation (1-20)
  trades_per_48h_min INTEGER DEFAULT 5, -- Minimal trades per 48h (1-20)
  profit_factor_min DECIMAL(10,2) DEFAULT 0.5, -- Minimal profit factor (0.5-5.0)
  drawdown_time_max INTEGER DEFAULT 12, -- Maximal drawdown time in hours (4-20)
  evaluation_positions_count1 INTEGER DEFAULT 25, -- First evaluation count (10-50)
  evaluation_positions_count2 INTEGER DEFAULT 50, -- Second evaluation count (50-100)
  
  -- Database Configuration
  database_positions_per_set INTEGER DEFAULT 250, -- Positions stored per set
  database_threshold_percent INTEGER DEFAULT 20, -- Threshold percentage
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset Types table - stores preset type configurations
CREATE TABLE IF NOT EXISTS preset_types (
  id VARCHAR(21) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Preset Type Configuration
  preset_trade_type VARCHAR(50) NOT NULL, -- Type identifier
  
  -- Coordination Settings
  max_positions_per_indication INTEGER DEFAULT 1,
  max_positions_per_direction INTEGER DEFAULT 1,
  max_positions_per_range INTEGER DEFAULT 1,
  timeout_per_indication INTEGER DEFAULT 5, -- seconds
  timeout_after_position INTEGER DEFAULT 10, -- seconds
  
  -- Strategy Configuration
  block_enabled BOOLEAN DEFAULT false,
  block_only BOOLEAN DEFAULT false,
  dca_enabled BOOLEAN DEFAULT false,
  dca_only BOOLEAN DEFAULT false,
  
  -- Auto Evaluation
  auto_evaluate BOOLEAN DEFAULT true,
  evaluation_interval_hours INTEGER DEFAULT 3,
  last_evaluation_at TIMESTAMP,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset Type Sets Assignment - links sets to preset types
CREATE TABLE IF NOT EXISTS preset_type_sets (
  id VARCHAR(21) PRIMARY KEY,
  preset_type_id VARCHAR(21) NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id VARCHAR(21) NOT NULL REFERENCES preset_configuration_sets(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Order of execution
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(preset_type_id, configuration_set_id)
);

-- Preset Coordination Results - stores backtest and evaluation results
CREATE TABLE IF NOT EXISTS preset_coordination_results (
  id VARCHAR(21) PRIMARY KEY,
  preset_type_id VARCHAR(21) NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id VARCHAR(21) NOT NULL REFERENCES preset_configuration_sets(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  
  -- Configuration Details
  indication_type VARCHAR(50) NOT NULL,
  indication_params JSONB NOT NULL,
  takeprofit_factor DECIMAL(10,2) NOT NULL,
  stoploss_ratio DECIMAL(10,2) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10,2),
  trail_stop DECIMAL(10,2),
  
  -- Performance Metrics
  profit_factor DECIMAL(10,4) DEFAULT 0,
  win_rate DECIMAL(10,4) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  avg_profit DECIMAL(10,4) DEFAULT 0,
  avg_loss DECIMAL(10,4) DEFAULT 0,
  max_drawdown DECIMAL(10,4) DEFAULT 0,
  drawdown_time_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Evaluation Metrics (last N positions)
  profit_factor_last_25 DECIMAL(10,4) DEFAULT 0,
  profit_factor_last_50 DECIMAL(10,4) DEFAULT 0,
  positions_per_24h DECIMAL(10,2) DEFAULT 0,
  
  -- Validation Status
  is_valid BOOLEAN DEFAULT false,
  validation_reason TEXT,
  last_validated_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(preset_type_id, configuration_set_id, symbol, indication_type, takeprofit_factor, stoploss_ratio, trailing_enabled, trail_start, trail_stop)
);

-- Preset Real Trades - tracks actual trades made from preset coordination
CREATE TABLE IF NOT EXISTS preset_real_trades (
  id VARCHAR(21) PRIMARY KEY,
  connection_id VARCHAR(21) NOT NULL,
  preset_type_id VARCHAR(21) NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id VARCHAR(21) NOT NULL REFERENCES preset_configuration_sets(id) ON DELETE CASCADE,
  coordination_result_id VARCHAR(21) REFERENCES preset_coordination_results(id) ON DELETE SET NULL,
  
  symbol VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'long' or 'short'
  
  -- Trade Details
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8),
  quantity DECIMAL(20,8) NOT NULL,
  leverage INTEGER DEFAULT 1,
  
  -- Configuration Used
  indication_type VARCHAR(50) NOT NULL,
  takeprofit_factor DECIMAL(10,2) NOT NULL,
  stoploss_ratio DECIMAL(10,2) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10,2),
  trail_stop DECIMAL(10,2),
  
  -- Performance
  profit_loss DECIMAL(20,8) DEFAULT 0,
  profit_factor DECIMAL(10,4) DEFAULT 0,
  fees_paid DECIMAL(20,8) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'cancelled'
  close_reason VARCHAR(100),
  
  -- Timestamps
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preset_config_sets_active ON preset_configuration_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_types_active ON preset_types(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_type_sets_preset ON preset_type_sets(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_type_sets_config ON preset_type_sets(configuration_set_id);
CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_preset ON preset_coordination_results(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_config ON preset_coordination_results(configuration_set_id);
CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_symbol ON preset_coordination_results(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_valid ON preset_coordination_results(is_valid);
CREATE INDEX IF NOT EXISTS idx_preset_real_trades_connection ON preset_real_trades(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_real_trades_preset ON preset_real_trades(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_real_trades_status ON preset_real_trades(status);
CREATE INDEX IF NOT EXISTS idx_preset_real_trades_opened ON preset_real_trades(opened_at);

-- Adding position limit tracking table for independent limits per configuration
CREATE TABLE IF NOT EXISTS preset_position_limits (
  id VARCHAR(21) PRIMARY KEY,
  preset_type_id VARCHAR(21) NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id VARCHAR(21) NOT NULL REFERENCES preset_configuration_sets(id) ON DELETE CASCADE,
  
  -- Configuration Combination (makes this limit unique)
  symbol VARCHAR(50) NOT NULL,
  indication_type VARCHAR(50) NOT NULL,
  indication_params_hash VARCHAR(64) NOT NULL, -- Hash of indication params for uniqueness
  takeprofit_factor DECIMAL(10,2) NOT NULL,
  stoploss_ratio DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'long' or 'short'
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10,2),
  trail_stop DECIMAL(10,2),
  
  -- Position Tracking
  current_positions INTEGER DEFAULT 0,
  max_positions INTEGER DEFAULT 1, -- Independent limit for this specific configuration
  last_position_opened_at TIMESTAMP,
  last_position_closed_at TIMESTAMP,
  
  -- Cooldown Tracking
  cooldown_until TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(preset_type_id, configuration_set_id, symbol, indication_params_hash, takeprofit_factor, stoploss_ratio, direction, trailing_enabled, trail_start, trail_stop)
);

-- Create indexes for position limit tracking
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_preset ON preset_position_limits(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_config ON preset_position_limits(configuration_set_id);
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_symbol ON preset_position_limits(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_direction ON preset_position_limits(direction);
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_current ON preset_position_limits(current_positions);
CREATE INDEX IF NOT EXISTS idx_preset_position_limits_cooldown ON preset_position_limits(cooldown_until);
