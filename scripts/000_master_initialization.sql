-- Master Database Initialization Script
-- This script initializes the complete database structure for CTS v3.1
-- Works with both SQLite (default) and PostgreSQL
-- Database Name: Project-Name
-- Username: Project-Name  
-- Password: 00998877

-- =============================================================================
-- CORE SYSTEM TABLES
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  api_key TEXT UNIQUE,
  api_secret TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Site logs table
CREATE TABLE IF NOT EXISTS site_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT (datetime('now')),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  details TEXT,
  user_id TEXT,
  connection_id TEXT,
  error_message TEXT,
  error_stack TEXT,
  metadata TEXT DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level);
CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category);
CREATE INDEX IF NOT EXISTS idx_site_logs_user_id ON site_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_site_logs_connection_id ON site_logs(connection_id);

-- =============================================================================
-- EXCHANGE CONNECTION TABLES
-- =============================================================================

-- Exchange connections table
CREATE TABLE IF NOT EXISTS exchange_connections (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_type TEXT NOT NULL DEFAULT 'spot',
  connection_method TEXT CHECK (connection_method IN ('rest', 'websocket', 'library', 'typescript')),
  library_package TEXT,
  api_key TEXT,
  api_secret TEXT,
  api_passphrase TEXT,
  margin_type TEXT DEFAULT 'cross' CHECK (margin_type IN ('cross', 'isolated')),
  position_mode TEXT DEFAULT 'hedge' CHECK (position_mode IN ('hedge', 'one_way')),
  is_testnet INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 0,
  is_live_trade INTEGER DEFAULT 0,
  is_preset_trade INTEGER DEFAULT 0,
  preset_type_id TEXT,
  volume_factor REAL DEFAULT 1.0,
  last_test_at TEXT,
  last_test_status TEXT,
  last_test_balance REAL,
  last_test_error TEXT,
  last_test_log TEXT,
  connection_settings TEXT DEFAULT '{}',
  api_capabilities TEXT DEFAULT '[]',
  rate_limits TEXT DEFAULT '{}',
  connection_priority TEXT DEFAULT '["rest","library","typescript","websocket"]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_exchange_connections_user ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_enabled ON exchange_connections(is_enabled);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_live_trade ON exchange_connections(is_live_trade);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_preset_trade ON exchange_connections(is_preset_trade);

-- Trade engine state table
CREATE TABLE IF NOT EXISTS trade_engine_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT UNIQUE REFERENCES exchange_connections(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error', 'starting')),
  last_indication_run TEXT,
  last_strategy_run TEXT,
  last_realtime_run TEXT,
  prehistoric_data_loaded INTEGER DEFAULT 0,
  prehistoric_data_start TEXT,
  prehistoric_data_end TEXT,
  active_positions_count INTEGER DEFAULT 0,
  total_volume REAL DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trade_engine_state_connection ON trade_engine_state(connection_id);
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_status ON trade_engine_state(status);

-- =============================================================================
-- INDICATION TABLES (Separate table for each indication type)
-- =============================================================================

-- Direction Indication Table
CREATE TABLE IF NOT EXISTS indications_direction (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 3 AND 30),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  price_change_ratio REAL,
  profit_factor REAL DEFAULT 1.0,
  confidence REAL DEFAULT 0.0,
  signal_strength REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_indications_direction_connection_symbol ON indications_direction(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_direction_performance ON indications_direction(connection_id, profit_factor DESC, confidence DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_direction_recent ON indications_direction(connection_id, symbol, calculated_at DESC);

-- Move Indication Table  
CREATE TABLE IF NOT EXISTS indications_move (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 3 AND 30),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  price_change_ratio REAL,
  momentum REAL,
  profit_factor REAL DEFAULT 1.0,
  confidence REAL DEFAULT 0.0,
  signal_strength REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_indications_move_connection_symbol ON indications_move(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_move_performance ON indications_move(connection_id, profit_factor DESC, momentum DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_move_recent ON indications_move(connection_id, symbol, calculated_at DESC);

-- Active Indication Table
CREATE TABLE IF NOT EXISTS indications_active (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 1 AND 10),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  activity_ratio REAL NOT NULL,
  time_window INTEGER NOT NULL,
  activity_for_calculated INTEGER,
  activity_last_part INTEGER,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  position_cost REAL,
  profit_factor REAL DEFAULT 1.0,
  confidence REAL DEFAULT 0.0,
  overall_change REAL,
  last_part_change REAL,
  volatility REAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_indications_active_connection_symbol ON indications_active(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_active_performance ON indications_active(connection_id, profit_factor DESC, activity_ratio DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_active_activity ON indications_active(connection_id, activity_ratio, time_window, calculated_at DESC);

-- Optimal Indication Table
CREATE TABLE IF NOT EXISTS indications_optimal (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  range_value INTEGER NOT NULL CHECK (range_value BETWEEN 1 AND 10),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  drawdown_ratio REAL NOT NULL,
  market_change_range INTEGER NOT NULL,
  last_part_ratio REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL DEFAULT 1.0,
  confidence REAL DEFAULT 0.0,
  win_rate REAL DEFAULT 0.0,
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'evaluating' CHECK (status IN ('evaluating', 'active', 'paused', 'failed')),
  evaluation_count INTEGER DEFAULT 0,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_indications_optimal_connection_symbol ON indications_optimal(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_optimal_performance ON indications_optimal(connection_id, profit_factor DESC, win_rate DESC) WHERE status IN ('active', 'evaluating');
CREATE INDEX IF NOT EXISTS idx_indications_optimal_evaluation ON indications_optimal(connection_id, evaluation_count, total_positions, status);

-- Auto Indication Table
CREATE TABLE IF NOT EXISTS indications_auto (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  auto_activity_ratio REAL NOT NULL,
  auto_time_window INTEGER NOT NULL,
  auto_use_8hour_analysis INTEGER DEFAULT 0,
  auto_progressive_threshold REAL,
  auto_trailing_optimal_min REAL,
  auto_trailing_optimal_max REAL,
  eight_hour_trend TEXT CHECK (eight_hour_trend IN ('bullish', 'bearish', 'neutral')),
  market_direction_short TEXT CHECK (market_direction_short IN ('up', 'down', 'sideways')),
  market_direction_long TEXT CHECK (market_direction_long IN ('up', 'down', 'sideways')),
  progressive_activity REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL DEFAULT 1.0,
  confidence REAL DEFAULT 0.0,
  signal_strength REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_indications_auto_connection_symbol ON indications_auto(connection_id, symbol, status, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_auto_performance ON indications_auto(connection_id, profit_factor DESC, signal_strength DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_indications_auto_market_analysis ON indications_auto(connection_id, eight_hour_trend, market_direction_short, calculated_at DESC);

-- =============================================================================
-- STRATEGY TABLES (Separate table for each strategy type)
-- =============================================================================

-- Base Strategy Table
CREATE TABLE IF NOT EXISTS strategies_base (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  indication_id TEXT NOT NULL,
  indication_type TEXT NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  profit_factor REAL DEFAULT 1.0,
  win_rate REAL DEFAULT 0.0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_base_connection_symbol ON strategies_base(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_base_indication ON strategies_base(indication_id, indication_type);
CREATE INDEX IF NOT EXISTS idx_strategies_base_performance ON strategies_base(connection_id, profit_factor DESC, win_rate DESC) WHERE status = 'active';

-- Main Strategy Table (Multi-position coordination)
CREATE TABLE IF NOT EXISTS strategies_main (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  indication_id TEXT NOT NULL,
  indication_type TEXT NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  last_positions_count INTEGER NOT NULL DEFAULT 3,
  position_coordination INTEGER DEFAULT 1,
  max_concurrent_positions INTEGER DEFAULT 3,
  profit_factor REAL DEFAULT 1.0,
  win_rate REAL DEFAULT 0.0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  avg_holding_time_minutes REAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_main_connection_symbol ON strategies_main(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_main_indication ON strategies_main(indication_id, indication_type);
CREATE INDEX IF NOT EXISTS idx_strategies_main_performance ON strategies_main(connection_id, profit_factor DESC, win_rate DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_strategies_main_coordination ON strategies_main(connection_id, symbol, max_concurrent_positions);

-- Real Strategy Table (Actual exchange positions)
CREATE TABLE IF NOT EXISTS strategies_real (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  main_strategy_id TEXT,
  indication_id TEXT NOT NULL,
  indication_type TEXT NOT NULL CHECK (indication_type IN ('direction', 'move', 'active', 'optimal', 'auto')),
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  volume REAL NOT NULL,
  exchange_position_id TEXT,
  exchange_order_id TEXT,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit_price REAL,
  stoploss_price REAL,
  profit_loss REAL DEFAULT 0,
  profit_loss_percent REAL DEFAULT 0,
  unrealized_pnl REAL DEFAULT 0,
  realized_pnl REAL DEFAULT 0,
  fees_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_strategies_real_connection_symbol ON strategies_real(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_main_strategy ON strategies_real(main_strategy_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_exchange_position ON strategies_real(exchange_position_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_performance ON strategies_real(connection_id, profit_loss DESC, opened_at DESC) WHERE status = 'open';

-- Block Strategy Table (Volume adjustment)
CREATE TABLE IF NOT EXISTS strategies_block (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  main_strategy_id TEXT NOT NULL,
  neutral_count INTEGER NOT NULL DEFAULT 1 CHECK (neutral_count BETWEEN 1 AND 3),
  current_wait_count INTEGER DEFAULT 0,
  total_blocks INTEGER DEFAULT 0,
  successful_blocks INTEGER DEFAULT 0,
  block_success_rate REAL DEFAULT 0.0,
  avg_wait_time_minutes REAL,
  is_active INTEGER DEFAULT 1,
  auto_deactivate_threshold INTEGER DEFAULT 25,
  reactivate_threshold INTEGER DEFAULT 40,
  deactivation_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deactivated')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_block_connection ON strategies_block(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_block_main_strategy ON strategies_block(main_strategy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_block_performance ON strategies_block(connection_id, block_success_rate DESC) WHERE status = 'active';

-- DCA Strategy Table
CREATE TABLE IF NOT EXISTS strategies_dca (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  main_strategy_id TEXT NOT NULL,
  dca_step INTEGER NOT NULL DEFAULT 1 CHECK (dca_step BETWEEN 1 AND 4),
  total_steps INTEGER NOT NULL DEFAULT 4,
  step_ratio REAL NOT NULL DEFAULT 1.0,
  total_dca_sequences INTEGER DEFAULT 0,
  completed_sequences INTEGER DEFAULT 0,
  partial_sequences INTEGER DEFAULT 0,
  avg_steps_per_sequence REAL,
  dca_success_rate REAL DEFAULT 0.0,
  is_active INTEGER DEFAULT 1,
  auto_deactivate_threshold INTEGER DEFAULT 25,
  reactivate_threshold INTEGER DEFAULT 40,
  deactivation_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deactivated')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_dca_connection ON strategies_dca(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_main_strategy ON strategies_dca(main_strategy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_performance ON strategies_dca(connection_id, dca_success_rate DESC) WHERE status = 'active';

-- Trailing Strategy Table
CREATE TABLE IF NOT EXISTS strategies_trailing (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('base', 'main', 'real')),
  trail_start REAL NOT NULL,
  trail_stop REAL NOT NULL,
  trailing_active INTEGER DEFAULT 0,
  highest_profit REAL DEFAULT 0,
  trailing_started_at TEXT,
  total_trails INTEGER DEFAULT 0,
  successful_trails INTEGER DEFAULT 0,
  trail_success_rate REAL DEFAULT 0.0,
  avg_additional_profit REAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_trailing_connection ON strategies_trailing(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_strategy ON strategies_trailing(strategy_id, strategy_type, trailing_active);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_performance ON strategies_trailing(connection_id, trail_success_rate DESC) WHERE status = 'active';

-- =============================================================================
-- PRESET TABLES
-- =============================================================================

-- Preset Types Table
CREATE TABLE IF NOT EXISTS preset_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT CHECK (category IN ('main', 'test', 'custom')),
  config TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Preset Configurations Table
CREATE TABLE IF NOT EXISTS preset_configurations (
  id TEXT PRIMARY KEY,
  preset_type_id TEXT NOT NULL REFERENCES preset_types(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol_mode TEXT DEFAULT 'main',
  forced_symbols TEXT,
  arrangement_type TEXT,
  arrangement_count INTEGER,
  indication_type TEXT NOT NULL,
  indication_params TEXT,
  strategy_type TEXT NOT NULL,
  strategy_params TEXT,
  volume_factor_ratio REAL DEFAULT 1.0,
  min_profit_factor REAL DEFAULT 1.0,
  min_profit_factor_positions INTEGER DEFAULT 25,
  max_drawdown_time_hours REAL DEFAULT 10,
  use_block INTEGER DEFAULT 0,
  use_dca INTEGER DEFAULT 0,
  use_trailing INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_preset_configurations_preset_type ON preset_configurations(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_configurations_connection ON preset_configurations(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_configurations_active ON preset_configurations(is_active);

-- =============================================================================
-- STATISTICS AND PERFORMANCE TABLES
-- =============================================================================

-- Historical data table
CREATE TABLE IF NOT EXISTS historical_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id, symbol, timeframe, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_historical_data_connection_symbol ON historical_data(connection_id, symbol);
CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp ON historical_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_historical_data_symbol_time ON historical_data(symbol, timeframe, timestamp DESC);

-- Position statistics table
CREATE TABLE IF NOT EXISTS position_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  total_profit REAL DEFAULT 0,
  total_loss REAL DEFAULT 0,
  avg_profit REAL DEFAULT 0,
  avg_loss REAL DEFAULT 0,
  max_profit REAL DEFAULT 0,
  max_loss REAL DEFAULT 0,
  profit_factor REAL DEFAULT 0,
  win_rate REAL DEFAULT 0,
  avg_holding_time_minutes REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id, strategy_type, symbol)
);

CREATE INDEX IF NOT EXISTS idx_position_statistics_connection ON position_statistics(connection_id);
CREATE INDEX IF NOT EXISTS idx_position_statistics_performance ON position_statistics(profit_factor DESC, win_rate DESC);

-- =============================================================================
-- COORDINATION AND CONTROL TABLES
-- =============================================================================

-- Indication states table
CREATE TABLE IF NOT EXISTS indication_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  indication_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('long', 'short')),
  position_range TEXT,
  active_positions INTEGER DEFAULT 0,
  last_position_at TEXT,
  cooldown_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id, indication_type, symbol, direction, position_range)
);

CREATE INDEX IF NOT EXISTS idx_indication_states_connection ON indication_states(connection_id);
CREATE INDEX IF NOT EXISTS idx_indication_states_symbol_type ON indication_states(connection_id, symbol, indication_type);
CREATE INDEX IF NOT EXISTS idx_indication_states_cooldown ON indication_states(cooldown_until);

-- Position limits tracking table
CREATE TABLE IF NOT EXISTS position_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  max_count INTEGER DEFAULT 1,
  last_position_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id, config_key)
);

CREATE INDEX IF NOT EXISTS idx_position_limits_connection ON position_limits(connection_id);
CREATE INDEX IF NOT EXISTS idx_position_limits_config_key ON position_limits(connection_id, config_key);

-- =============================================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =============================================================================

INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
  ('database_type', 'sqlite', 'Database type: sqlite or postgresql'),
  ('preset_evaluation_interval', '10800', 'Preset evaluation update interval in seconds (default: 3 hours)'),
  ('preset_position_threshold', '250', 'Number of positions for preset evaluation threshold'),
  ('preset_profit_threshold', '0.2', 'Profit threshold for preset validation (20%)'),
  ('max_positions_per_config', '1', 'Maximum positions per configuration combination'),
  ('position_timeout', '5', 'Timeout between positions for same indication (seconds)'),
  ('coordination_timeout', '10', 'Timeout after position for coordination (seconds)'),
  ('high_frequency_mode', '1', 'Enable high-frequency trading optimizations'),
  ('max_concurrent_strategies', '50', 'Maximum concurrent strategies per connection');

-- =============================================================================
-- INITIALIZATION COMPLETE
-- =============================================================================
-- Database: Project-Name
-- SQLite is the default system
-- All tables have been created with proper indexes for high-frequency performance
-- Separate tables for each indication type and strategy type
-- Ready for production use
-- =============================================================================
