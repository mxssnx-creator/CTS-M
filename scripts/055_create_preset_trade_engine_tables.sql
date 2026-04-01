-- Migration 055: Create Preset Trade Engine Tables
-- These tables support the preset coordination engine for automated trading
-- FIXED: Removed PostgreSQL-specific syntax, made database-agnostic

-- Preset Trade Engine State Table
CREATE TABLE IF NOT EXISTS preset_trade_engine_state (
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped', -- 'running', 'stopped', 'error', 'testing'
  testing_progress INTEGER DEFAULT 0, -- 0-100
  testing_message TEXT,
  error_message TEXT,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (connection_id, preset_id)
);

-- Preset Trades Table (different from preset_real_trades, used for pseudo/simulation trades)
CREATE TABLE IF NOT EXISTS preset_trades (
  id TEXT PRIMARY KEY, -- Removed gen_random_uuid(), will be generated in application
  preset_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'long', 'short'
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  takeprofit DECIMAL(20, 8),
  stoploss DECIMAL(20, 8),
  trailing_enabled INTEGER DEFAULT 0, -- Changed BOOLEAN to INTEGER for SQLite
  indicator_type TEXT NOT NULL,
  indicator_params TEXT NOT NULL DEFAULT '{}', -- Changed JSONB to TEXT
  profit_loss DECIMAL(20, 8),
  fees_paid DECIMAL(20, 8) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'cancelled'
  close_reason TEXT, -- 'takeprofit', 'stoploss', 'timeout', 'manual', 'trailing'
  opened_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset Pseudo Positions Table (for simulation/backtesting)
CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'base', -- 'base', 'main', 'real'
  direction TEXT, -- 'long', 'short'
  indication_type TEXT,
  indication_range INTEGER,
  indication_category TEXT DEFAULT 'main', -- 'main', 'common'
  
  -- Position Configuration
  takeprofit_factor DECIMAL(10, 4),
  stoploss_ratio DECIMAL(10, 4),
  trailing_enabled INTEGER DEFAULT 0, -- Changed BOOLEAN to INTEGER
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  
  -- Price Tracking
  entry_price DECIMAL(20, 8),
  current_price DECIMAL(20, 8),
  exit_price DECIMAL(20, 8),
  price_high DECIMAL(20, 8),
  price_low DECIMAL(20, 8),
  
  -- Performance
  profit_factor DECIMAL(10, 4),
  profit_loss DECIMAL(20, 8) DEFAULT 0,
  position_cost DECIMAL(20, 8),
  max_drawdown DECIMAL(10, 4),
  
  -- Hierarchy
  main_position_id TEXT,
  base_position_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'cancelled', 'evaluating'
  close_reason TEXT,
  
  -- Common indicators tracking (JSON array of indicator names)
  common_indicators_used TEXT DEFAULT '[]', -- Added this column here for completeness
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Indexes for preset_trade_engine_state
CREATE INDEX IF NOT EXISTS idx_preset_engine_state_connection ON preset_trade_engine_state(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_engine_state_status ON preset_trade_engine_state(status);

-- Indexes for preset_trades
CREATE INDEX IF NOT EXISTS idx_preset_trades_preset ON preset_trades(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_trades_connection ON preset_trades(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_trades_symbol ON preset_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_trades_status ON preset_trades(status);
CREATE INDEX IF NOT EXISTS idx_preset_trades_opened ON preset_trades(opened_at);
CREATE INDEX IF NOT EXISTS idx_preset_trades_indicator ON preset_trades(indicator_type);

-- Indexes for preset_pseudo_positions
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_connection ON preset_pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_preset ON preset_pseudo_positions(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_type ON preset_pseudo_positions(type);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_status ON preset_pseudo_positions(status);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_symbol ON preset_pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_main ON preset_pseudo_positions(main_position_id);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_base ON preset_pseudo_positions(base_position_id);

-- Add preset_type_id column to exchange_connections if not exists
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS preset_type_id TEXT;

-- Removed PostgreSQL DO $$ block, system_settings should be created by separate migration
