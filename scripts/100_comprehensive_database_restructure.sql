-- Migration 100: Comprehensive Database Restructure
-- Implements separate tables for each indication type and strategy type
-- Adds comprehensive indexes for high-frequency trading performance
-- Database: Project-Name, User: Project-Name, Password: 00998877

-- =============================================================================
-- INDICATION TYPE TABLES (Separate table for each indication type)
-- =============================================================================

-- Direction Indication Table
CREATE TABLE IF NOT EXISTS indications_direction (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 3 AND 30),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Price and market data
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  price_change_ratio DECIMAL(10, 4),
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  signal_strength DECIMAL(5, 4) DEFAULT 0.0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Move Indication Table  
CREATE TABLE IF NOT EXISTS indications_move (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 3 AND 30),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Price and market data
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  price_change_ratio DECIMAL(10, 4),
  momentum DECIMAL(10, 4),
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  signal_strength DECIMAL(5, 4) DEFAULT 0.0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Active Indication Table
CREATE TABLE IF NOT EXISTS indications_active (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 1 AND 10),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Active-specific parameters
  activity_ratio DECIMAL(10, 4) NOT NULL,
  time_window INTEGER NOT NULL,
  activity_for_calculated INTEGER,
  activity_last_part INTEGER,
  
  -- Price and market data
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  position_cost DECIMAL(20, 8),
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  overall_change DECIMAL(10, 4),
  last_part_change DECIMAL(10, 4),
  volatility DECIMAL(10, 4),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Optimal Indication Table
CREATE TABLE IF NOT EXISTS indications_optimal (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 1 AND 10),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Optimal-specific parameters
  drawdown_ratio DECIMAL(5, 2) NOT NULL,
  market_change_range INTEGER NOT NULL,
  last_part_ratio DECIMAL(5, 2) NOT NULL,
  
  -- Price and market data
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  win_rate DECIMAL(5, 4) DEFAULT 0.0,
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'evaluating' CHECK (status IN ('evaluating', 'active', 'paused', 'failed')),
  evaluation_count INTEGER DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Auto Indication Table
CREATE TABLE IF NOT EXISTS indications_auto (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Auto-specific parameters
  auto_activity_ratio DECIMAL(10, 4) NOT NULL,
  auto_time_window INTEGER NOT NULL,
  auto_use_8hour_analysis BOOLEAN DEFAULT false,
  auto_progressive_threshold DECIMAL(10, 4),
  auto_trailing_optimal_min DECIMAL(10, 4),
  auto_trailing_optimal_max DECIMAL(10, 4),
  
  -- Market analysis
  eight_hour_trend VARCHAR(20) CHECK (eight_hour_trend IN ('bullish', 'bearish', 'neutral')),
  market_direction_short VARCHAR(20) CHECK (market_direction_short IN ('up', 'down', 'sideways')),
  market_direction_long VARCHAR(20) CHECK (market_direction_long IN ('up', 'down', 'sideways')),
  progressive_activity DECIMAL(10, 4),
  
  -- Price and market data
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  confidence DECIMAL(5, 4) DEFAULT 0.0,
  signal_strength DECIMAL(5, 4) DEFAULT 0.0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- =============================================================================
-- STRATEGY TYPE TABLES (Separate table for each strategy type)
-- =============================================================================

-- Base Strategy Table
CREATE TABLE IF NOT EXISTS strategies_base (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  indication_id TEXT NOT NULL,
  indication_type VARCHAR(20) NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  
  -- Strategy parameters
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  win_rate DECIMAL(5, 4) DEFAULT 0.0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Main Strategy Table (Multi-position coordination)
CREATE TABLE IF NOT EXISTS strategies_main (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  indication_id TEXT NOT NULL,
  indication_type VARCHAR(20) NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  
  -- Strategy parameters
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  last_positions_count INTEGER NOT NULL DEFAULT 3,
  
  -- Coordination parameters
  position_coordination BOOLEAN DEFAULT true,
  max_concurrent_positions INTEGER DEFAULT 3,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  win_rate DECIMAL(5, 4) DEFAULT 0.0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  avg_holding_time_minutes DECIMAL(10, 2),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Real Strategy Table (Actual exchange positions)
CREATE TABLE IF NOT EXISTS strategies_real (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  main_strategy_id TEXT,
  indication_id TEXT NOT NULL,
  indication_type VARCHAR(20) NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  
  -- Strategy parameters
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  
  -- Exchange data
  exchange_position_id TEXT,
  exchange_order_id TEXT,
  
  -- Price tracking
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  takeprofit_price DECIMAL(20, 8),
  stoploss_price DECIMAL(20, 8),
  
  -- Performance metrics
  profit_loss DECIMAL(20, 8) DEFAULT 0,
  profit_loss_percent DECIMAL(10, 4) DEFAULT 0,
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  realized_pnl DECIMAL(20, 8) DEFAULT 0,
  fees_paid DECIMAL(20, 8) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  
  -- Timestamps
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Block Strategy Table (Volume adjustment - wait positions)
CREATE TABLE IF NOT EXISTS strategies_block (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  main_strategy_id TEXT NOT NULL,
  
  -- Block parameters
  neutral_count INTEGER NOT NULL DEFAULT 1 CHECK (neutral_count BETWEEN 1 AND 3),
  current_wait_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_blocks INTEGER DEFAULT 0,
  successful_blocks INTEGER DEFAULT 0,
  block_success_rate DECIMAL(5, 4) DEFAULT 0.0,
  avg_wait_time_minutes DECIMAL(10, 2),
  
  -- Auto deactivation
  is_active BOOLEAN DEFAULT true,
  auto_deactivate_threshold INTEGER DEFAULT 25,
  reactivate_threshold INTEGER DEFAULT 40,
  deactivation_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deactivated')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DCA Strategy Table (Dollar Cost Averaging)
CREATE TABLE IF NOT EXISTS strategies_dca (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  main_strategy_id TEXT NOT NULL,
  
  -- DCA parameters
  dca_step INTEGER NOT NULL DEFAULT 1 CHECK (dca_step BETWEEN 1 AND 4),
  total_steps INTEGER NOT NULL DEFAULT 4,
  step_ratio DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  
  -- Performance metrics
  total_dca_sequences INTEGER DEFAULT 0,
  completed_sequences INTEGER DEFAULT 0,
  partial_sequences INTEGER DEFAULT 0,
  avg_steps_per_sequence DECIMAL(5, 2),
  dca_success_rate DECIMAL(5, 4) DEFAULT 0.0,
  
  -- Auto deactivation
  is_active BOOLEAN DEFAULT true,
  auto_deactivate_threshold INTEGER DEFAULT 25,
  reactivate_threshold INTEGER DEFAULT 40,
  deactivation_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deactivated')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trailing Strategy Table
CREATE TABLE IF NOT EXISTS strategies_trailing (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  strategy_id TEXT NOT NULL,
  strategy_type VARCHAR(20) NOT NULL CHECK (strategy_type IN ('base', 'main', 'real')),
  
  -- Trailing parameters
  trail_start DECIMAL(10, 4) NOT NULL,
  trail_stop DECIMAL(10, 4) NOT NULL,
  trailing_active BOOLEAN DEFAULT false,
  
  -- Tracking
  highest_profit DECIMAL(20, 8) DEFAULT 0,
  trailing_started_at TIMESTAMP,
  
  -- Performance metrics
  total_trails INTEGER DEFAULT 0,
  successful_trails INTEGER DEFAULT 0,
  trail_success_rate DECIMAL(5, 4) DEFAULT 0.0,
  avg_additional_profit DECIMAL(20, 8),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRESET TABLES
-- =============================================================================

-- Preset Types Table
CREATE TABLE IF NOT EXISTS preset_types (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('main', 'test', 'custom')),
  
  -- Configuration
  config JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Preset Configurations Table
CREATE TABLE IF NOT EXISTS preset_configurations (
  id TEXT PRIMARY KEY,
  preset_type_id TEXT NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL,
  
  -- Symbol selection
  symbol_mode VARCHAR(20) DEFAULT 'main',
  forced_symbols TEXT, -- JSON array
  arrangement_type VARCHAR(50),
  arrangement_count INTEGER,
  
  -- Indication configuration
  indication_type VARCHAR(20) NOT NULL,
  indication_params JSONB,
  
  -- Strategy configuration
  strategy_type VARCHAR(20) NOT NULL,
  strategy_params JSONB,
  
  -- Volume settings
  volume_factor_ratio DECIMAL(10, 4) DEFAULT 1.0,
  
  -- Performance filters
  min_profit_factor DECIMAL(10, 4) DEFAULT 1.0,
  min_profit_factor_positions INTEGER DEFAULT 25,
  max_drawdown_time_hours DECIMAL(10, 2) DEFAULT 10,
  
  -- Additional strategies
  use_block BOOLEAN DEFAULT false,
  use_dca BOOLEAN DEFAULT false,
  use_trailing BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- HIGH-FREQUENCY PERFORMANCE INDEXES
-- =============================================================================

-- Direction Indication Indexes
CREATE INDEX IF NOT EXISTS idx_indications_direction_connection_symbol 
  ON indications_direction(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_direction_performance 
  ON indications_direction(connection_id, profit_factor DESC, confidence DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_direction_recent 
  ON indications_direction(connection_id, calculated_at DESC) 
  WHERE calculated_at > NOW() - INTERVAL '1 hour';

-- Move Indication Indexes
CREATE INDEX IF NOT EXISTS idx_indications_move_connection_symbol 
  ON indications_move(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_move_performance 
  ON indications_move(connection_id, profit_factor DESC, momentum DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_move_recent 
  ON indications_move(connection_id, calculated_at DESC) 
  WHERE calculated_at > NOW() - INTERVAL '1 hour';

-- Active Indication Indexes
CREATE INDEX IF NOT EXISTS idx_indications_active_connection_symbol 
  ON indications_active(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_active_performance 
  ON indications_active(connection_id, profit_factor DESC, activity_ratio DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_active_activity 
  ON indications_active(connection_id, activity_ratio, time_window, calculated_at DESC);

-- Optimal Indication Indexes
CREATE INDEX IF NOT EXISTS idx_indications_optimal_connection_symbol 
  ON indications_optimal(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_optimal_performance 
  ON indications_optimal(connection_id, profit_factor DESC, win_rate DESC) 
  WHERE status IN ('active', 'evaluating');
CREATE INDEX IF NOT EXISTS idx_indications_optimal_evaluation 
  ON indications_optimal(connection_id, evaluation_count, total_positions, status);

-- Auto Indication Indexes
CREATE INDEX IF NOT EXISTS idx_indications_auto_connection_symbol 
  ON indications_auto(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_auto_performance 
  ON indications_auto(connection_id, profit_factor DESC, signal_strength DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_auto_market_analysis 
  ON indications_auto(connection_id, eight_hour_trend, market_direction_short, calculated_at DESC);

-- Base Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_base_connection_symbol 
  ON strategies_base(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_base_indication 
  ON strategies_base(indication_id, indication_type);
CREATE INDEX IF NOT EXISTS idx_strategies_base_performance 
  ON strategies_base(connection_id, profit_factor DESC, win_rate DESC) 
  WHERE status = 'active';

-- Main Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_main_connection_symbol 
  ON strategies_main(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_main_indication 
  ON strategies_main(indication_id, indication_type);
CREATE INDEX IF NOT EXISTS idx_strategies_main_performance 
  ON strategies_main(connection_id, profit_factor DESC, win_rate DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_strategies_main_coordination 
  ON strategies_main(connection_id, symbol, max_concurrent_positions);

-- Real Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_real_connection_symbol 
  ON strategies_real(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_main_strategy 
  ON strategies_real(main_strategy_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_exchange_position 
  ON strategies_real(exchange_position_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_performance 
  ON strategies_real(connection_id, profit_loss DESC, opened_at DESC) 
  WHERE status = 'open';

-- Block Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_block_connection 
  ON strategies_block(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_block_main_strategy 
  ON strategies_block(main_strategy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_block_performance 
  ON strategies_block(connection_id, block_success_rate DESC) 
  WHERE status = 'active';

-- DCA Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_dca_connection 
  ON strategies_dca(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_main_strategy 
  ON strategies_dca(main_strategy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_performance 
  ON strategies_dca(connection_id, dca_success_rate DESC) 
  WHERE status = 'active';

-- Trailing Strategy Indexes
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_connection 
  ON strategies_trailing(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_strategy 
  ON strategies_trailing(strategy_id, strategy_type, trailing_active);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_performance 
  ON strategies_trailing(connection_id, trail_success_rate DESC) 
  WHERE status = 'active';

-- Preset Configuration Indexes
CREATE INDEX IF NOT EXISTS idx_preset_configurations_preset_type 
  ON preset_configurations(preset_type_id, is_active);
CREATE INDEX IF NOT EXISTS idx_preset_configurations_connection 
  ON preset_configurations(connection_id, is_active);
CREATE INDEX IF NOT EXISTS idx_preset_configurations_indication 
  ON preset_configurations(indication_type, strategy_type, is_active);

-- =============================================================================
-- STATISTICS AND AGGREGATION VIEWS
-- =============================================================================

-- Unified Indication Performance View
CREATE OR REPLACE VIEW v_indication_performance AS
SELECT 'direction' as indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at FROM indications_direction
UNION ALL
SELECT 'move' as indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at FROM indications_move
UNION ALL
SELECT 'active' as indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at FROM indications_active
UNION ALL
SELECT 'optimal' as indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at FROM indications_optimal
UNION ALL
SELECT 'auto' as indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at FROM indications_auto;

-- Unified Strategy Performance View
CREATE OR REPLACE VIEW v_strategy_performance AS
SELECT 'base' as strategy_type, connection_id, symbol, profit_factor, win_rate, total_trades, status FROM strategies_base
UNION ALL
SELECT 'main' as strategy_type, connection_id, symbol, profit_factor, win_rate, total_trades, status FROM strategies_main
UNION ALL
SELECT 'real' as strategy_type, connection_id, symbol, 
       CASE WHEN profit_loss > 0 THEN 1.0 + (profit_loss / NULLIF(entry_price * volume, 0)) 
            WHEN profit_loss < 0 THEN 1.0 - (ABS(profit_loss) / NULLIF(entry_price * volume, 0))
            ELSE 1.0 END as profit_factor,
       0.0 as win_rate, 1 as total_trades, status 
FROM strategies_real;

-- Daily Performance Summary
CREATE OR REPLACE VIEW v_daily_performance AS
SELECT 
  DATE(opened_at) as trade_date,
  connection_id,
  indication_type,
  COUNT(*) as total_trades,
  SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
  SUM(profit_loss) as total_pnl,
  AVG(profit_loss) as avg_pnl,
  MAX(profit_loss) as max_profit,
  MIN(profit_loss) as max_loss
FROM strategies_real
WHERE status = 'closed'
GROUP BY DATE(opened_at), connection_id, indication_type;
