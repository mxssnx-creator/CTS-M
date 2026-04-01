-- =============================================================================
-- CTS v3.1 - UNIFIED COMPLETE DATABASE SETUP
-- =============================================================================
-- This script consolidates all migrations into one complete database setup
-- Compatible with both PostgreSQL and SQLite
-- Run this script to initialize a fresh database with all tables, indexes, and data
-- =============================================================================

-- Drop views if they exist (for clean setup)
DROP VIEW IF EXISTS v_indication_performance;
DROP VIEW IF EXISTS v_strategy_performance;
DROP VIEW IF EXISTS v_daily_performance;

-- =============================================================================
-- CORE SYSTEM TABLES
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name);

-- Site logs
CREATE TABLE IF NOT EXISTS site_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  user_id TEXT,
  connection_id TEXT,
  error_message TEXT,
  error_stack TEXT,
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level);
CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category);
CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_site_logs_connection ON site_logs(connection_id, timestamp DESC);

-- =============================================================================
-- EXCHANGE CONNECTION TABLES
-- =============================================================================

-- Exchange connections
CREATE TABLE IF NOT EXISTS exchange_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  api_passphrase TEXT,
  testnet INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  preset_type TEXT DEFAULT 'main',
  connection_settings TEXT DEFAULT '{}',
  last_test_at DATETIME,
  last_test_result TEXT,
  last_connection_at DATETIME,
  minimum_connect_interval INTEGER DEFAULT 60,
  dual_mode_enabled INTEGER DEFAULT 0,
  dual_mode_settings TEXT DEFAULT '{}',
  indication_direction INTEGER DEFAULT 0,
  indication_move INTEGER DEFAULT 0,
  indication_active INTEGER DEFAULT 0,
  indication_optimal INTEGER DEFAULT 0,
  indication_auto INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, preset_type)
);
CREATE INDEX IF NOT EXISTS idx_connections_exchange ON exchange_connections(exchange, is_active);
CREATE INDEX IF NOT EXISTS idx_connections_preset ON exchange_connections(preset_type, is_active);
CREATE INDEX IF NOT EXISTS idx_connections_active ON exchange_connections(is_active, preset_type);

-- Connection coordination
CREATE TABLE IF NOT EXISTS connection_coordination (
  connection_id INTEGER PRIMARY KEY,
  last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'idle',
  current_operation TEXT,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coordination_status ON connection_coordination(status, last_heartbeat);

-- =============================================================================
-- INDICATION TABLES (Separate table for each type)
-- =============================================================================

-- Direction Indications
CREATE TABLE IF NOT EXISTS indications_direction (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT,
  confidence REAL DEFAULT 0,
  profit_factor REAL DEFAULT 1.0,
  signal_strength REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_direction_conn_symbol ON indications_direction(connection_id, symbol, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_direction_status ON indications_direction(connection_id, status, calculated_at DESC);

-- Move Indications
CREATE TABLE IF NOT EXISTS indications_move (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  move_type TEXT,
  momentum REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  profit_factor REAL DEFAULT 1.0,
  status TEXT DEFAULT 'active',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_move_conn_symbol ON indications_move(connection_id, symbol, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_move_status ON indications_move(connection_id, status, calculated_at DESC);

-- Active Indications
CREATE TABLE IF NOT EXISTS indications_active (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  activity_level REAL DEFAULT 0,
  volatility REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  profit_factor REAL DEFAULT 1.0,
  status TEXT DEFAULT 'active',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_active_conn_symbol ON indications_active(connection_id, symbol, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_active_status ON indications_active(connection_id, status, calculated_at DESC);

-- Optimal Indications
CREATE TABLE IF NOT EXISTS indications_optimal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  optimization_score REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  profit_factor REAL DEFAULT 1.0,
  recommended_action TEXT,
  status TEXT DEFAULT 'active',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_optimal_conn_symbol ON indications_optimal(connection_id, symbol, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_optimal_status ON indications_optimal(connection_id, status, calculated_at DESC);

-- Auto Indications
CREATE TABLE IF NOT EXISTS indications_auto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  auto_signal TEXT,
  confidence REAL DEFAULT 0,
  profit_factor REAL DEFAULT 1.0,
  eight_hour_trend TEXT,
  market_direction_short TEXT,
  market_direction_long TEXT,
  progressive_activity REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_auto_conn_symbol ON indications_auto(connection_id, symbol, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indications_auto_status ON indications_auto(connection_id, status, calculated_at DESC);

-- Indication states (for all types)
CREATE TABLE IF NOT EXISTS indication_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  state_key TEXT NOT NULL,
  state_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id, state_key),
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indication_states_key ON indication_states(connection_id, state_key);

-- =============================================================================
-- STRATEGY TABLES (Separate table for each type)
-- =============================================================================

-- Base Strategies
CREATE TABLE IF NOT EXISTS strategies_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  strategy_config TEXT DEFAULT '{}',
  profit_factor REAL DEFAULT 1.0,
  win_rate REAL DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_base_conn_symbol ON strategies_base(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_base_performance ON strategies_base(connection_id, profit_factor DESC, win_rate DESC);

-- Main Strategies
CREATE TABLE IF NOT EXISTS strategies_main (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  strategy_config TEXT DEFAULT '{}',
  profit_factor REAL DEFAULT 1.0,
  win_rate REAL DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_main_conn_symbol ON strategies_main(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_main_performance ON strategies_main(connection_id, profit_factor DESC, win_rate DESC);

-- Real Strategies (Active positions)
CREATE TABLE IF NOT EXISTS strategies_real (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL,
  volume REAL NOT NULL,
  profit_loss REAL DEFAULT 0,
  profit_loss_percent REAL DEFAULT 0,
  stop_loss REAL,
  take_profit REAL,
  status TEXT DEFAULT 'open',
  indication_type TEXT,
  strategy_type TEXT,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_real_conn_symbol ON strategies_real(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_real_status ON strategies_real(status, connection_id);
CREATE INDEX IF NOT EXISTS idx_strategies_real_opened ON strategies_real(connection_id, opened_at DESC);

-- Block Strategies
CREATE TABLE IF NOT EXISTS strategies_block (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  block_config TEXT DEFAULT '{}',
  block_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_block_conn_symbol ON strategies_block(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_block_success ON strategies_block(connection_id, success_rate DESC);

-- DCA Strategies
CREATE TABLE IF NOT EXISTS strategies_dca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  dca_config TEXT DEFAULT '{}',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 4,
  average_entry REAL DEFAULT 0,
  total_invested REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_conn_symbol ON strategies_dca(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_dca_step ON strategies_dca(connection_id, current_step, total_steps);

-- Trailing Strategies
CREATE TABLE IF NOT EXISTS strategies_trailing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  trailing_config TEXT DEFAULT '{}',
  trail_distance REAL DEFAULT 0,
  trail_success_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_conn_symbol ON strategies_trailing(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_strategies_trailing_success ON strategies_trailing(connection_id, trail_success_rate DESC);

-- =============================================================================
-- TRADE ENGINE AND TRACKING TABLES
-- =============================================================================

-- Trade Engine State
CREATE TABLE IF NOT EXISTS trade_engine_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  last_indication_run DATETIME,
  last_strategy_run DATETIME,
  last_realtime_run DATETIME,
  prehistoric_data_loaded INTEGER DEFAULT 0,
  prehistoric_data_start DATETIME,
  prehistoric_data_end DATETIME,
  active_positions_count INTEGER DEFAULT 0,
  total_volume REAL DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id),
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_connection ON trade_engine_state(connection_id);
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_status ON trade_engine_state(status);

-- Indications (main table)
CREATE TABLE IF NOT EXISTS indications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  value REAL NOT NULL,
  profit_factor REAL,
  confidence REAL,
  metadata TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_indications_connection ON indications(connection_id);
CREATE INDEX IF NOT EXISTS idx_indications_symbol ON indications(symbol);
CREATE INDEX IF NOT EXISTS idx_indications_calculated_at ON indications(calculated_at DESC);

-- =============================================================================
-- PRESET AND CONFIGURATION TABLES
-- =============================================================================

-- Preset types
CREATE TABLE IF NOT EXISTS preset_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Preset Type Sets
CREATE TABLE IF NOT EXISTS preset_type_sets (
  id TEXT PRIMARY KEY,
  preset_type_id TEXT NOT NULL,
  configuration_set_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(preset_type_id, configuration_set_id)
);
CREATE INDEX IF NOT EXISTS idx_preset_type_sets_preset ON preset_type_sets(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_type_sets_config ON preset_type_sets(configuration_set_id);

-- Preset configurations
CREATE TABLE IF NOT EXISTS preset_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_type_id INTEGER NOT NULL,
  connection_id INTEGER NOT NULL,
  indication_type TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  config_data TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (preset_type_id) REFERENCES preset_types(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_preset_config_preset_type ON preset_configurations(preset_type_id, is_active);
CREATE INDEX IF NOT EXISTS idx_preset_config_connection ON preset_configurations(connection_id, is_active);
CREATE INDEX IF NOT EXISTS idx_preset_config_indication ON preset_configurations(indication_type, strategy_type, is_active);

-- Preset strategies (validated strategies per preset)
CREATE TABLE IF NOT EXISTS preset_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id INTEGER,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,
  indication_range INTEGER NOT NULL,
  strategy_type TEXT NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled INTEGER DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  block_adjustment_enabled INTEGER DEFAULT 0,
  block_size INTEGER,
  block_adjustment_ratio REAL,
  dca_adjustment_enabled INTEGER DEFAULT 0,
  dca_levels INTEGER,
  volume_factor REAL DEFAULT 1.0,
  profit_factor REAL NOT NULL,
  win_rate REAL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  max_drawdown REAL,
  is_validated INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_validated_at DATETIME,
  validation_period_start DATETIME,
  validation_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_preset_strategies_connection ON preset_strategies(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_strategies_symbol ON preset_strategies(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_strategies_validated ON preset_strategies(is_validated);
CREATE INDEX IF NOT EXISTS idx_preset_strategies_active ON preset_strategies(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_strategies_profit_factor ON preset_strategies(profit_factor DESC);

-- =============================================================================
-- MARKET DATA AND TRADING TABLES
-- =============================================================================

-- Market data
CREATE TABLE IF NOT EXISTS market_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  volume REAL,
  bid REAL,
  ask REAL,
  high_24h REAL,
  low_24h REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_market_data_conn_symbol ON market_data(connection_id, symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time ON market_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_recent ON market_data(connection_id, timestamp DESC);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  exchange_order_id TEXT UNIQUE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  type TEXT NOT NULL,
  price REAL,
  amount REAL NOT NULL,
  filled REAL DEFAULT 0,
  remaining REAL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_conn_symbol ON orders(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, connection_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(connection_id, created_at DESC);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  order_id INTEGER,
  exchange_trade_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  price REAL NOT NULL,
  amount REAL NOT NULL,
  fee REAL DEFAULT 0,
  fee_currency TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_trades_conn_symbol ON trades(connection_id, symbol, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_order ON trades(order_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON trades(connection_id, executed_at DESC);

-- =============================================================================
-- PSEUDO POSITIONS (for testing and simulation)
-- =============================================================================

-- Base pseudo positions
CREATE TABLE IF NOT EXISTS base_pseudo_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_price REAL NOT NULL,
  volume REAL NOT NULL,
  indication_type TEXT,
  strategy_type TEXT,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_conn_symbol ON base_pseudo_positions(connection_id, symbol, status);

-- Pseudo positions (active)
CREATE TABLE IF NOT EXISTS pseudo_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL,
  volume REAL NOT NULL,
  profit_loss REAL DEFAULT 0,
  profit_loss_percent REAL DEFAULT 0,
  stop_loss REAL,
  take_profit REAL,
  status TEXT DEFAULT 'open',
  indication_type TEXT,
  strategy_type TEXT,
  eight_hour_trend TEXT,
  market_direction_short TEXT,
  market_direction_long TEXT,
  progressive_activity REAL,
  block_neutral_count INTEGER DEFAULT 0,
  level_volume_ratio REAL,
  dca_step INTEGER DEFAULT 1,
  dca_total_steps INTEGER DEFAULT 4,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_conn_symbol ON pseudo_positions(connection_id, symbol, status);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_status ON pseudo_positions(status, connection_id);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_indication ON pseudo_positions(connection_id, indication_type, strategy_type);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_created ON pseudo_positions(connection_id, symbol, opened_at DESC);

-- =============================================================================
-- PERFORMANCE AND STATISTICS TABLES
-- =============================================================================

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  period TEXT DEFAULT 'daily',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_performance_conn_type ON performance_metrics(connection_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_period ON performance_metrics(period, recorded_at DESC);

-- Data cleanup log
CREATE TABLE IF NOT EXISTS data_cleanup_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cleanup_type TEXT NOT NULL,
  records_cleaned INTEGER NOT NULL,
  records_archived INTEGER,
  cleanup_started_at DATETIME NOT NULL,
  cleanup_completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_cleanup_log_time ON data_cleanup_log(cleanup_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cleanup_log_type ON data_cleanup_log(cleanup_type);

-- Archived market data
CREATE TABLE IF NOT EXISTS archived_market_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  volume REAL,
  timestamp DATETIME NOT NULL,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_archived_connection_symbol ON archived_market_data(connection_id, symbol);
CREATE INDEX IF NOT EXISTS idx_archived_timestamp ON archived_market_data(timestamp DESC);

-- =============================================================================
-- PREDEFINED PRESET CONNECTIONS
-- =============================================================================

-- Insert predefined preset types
INSERT OR IGNORE INTO preset_types (name, description) VALUES
  ('main', 'Main trading preset for live operations'),
  ('base', 'Base testing preset for strategy development'),
  ('real', 'Real position tracking preset'),
  ('optimal', 'Optimal configuration preset'),
  ('auto', 'Automated trading preset');

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description, category) VALUES
  ('marketDataRetentionDays', '7', 'Number of days to keep market data', 'performance'),
  ('indicationStateRetentionHours', '48', 'Number of hours to keep indication states', 'performance'),
  ('marketDataQueryMaxMinutes', '60', 'Maximum minutes to fetch in a single query', 'performance'),
  ('enableAutoCleanup', 'true', 'Automatically cleanup old data', 'performance'),
  ('cleanupIntervalHours', '24', 'How often to run automatic cleanup', 'performance'),
  ('defaultIndicationType', 'direction', 'Default indication type for new connections', 'trading'),
  ('defaultStrategyType', 'base', 'Default strategy type for new connections', 'trading'),
  ('enableRealTimeUpdates', 'true', 'Enable real-time price updates', 'trading'),
  ('maxConcurrentConnections', '10', 'Maximum concurrent exchange connections', 'system'),
  ('logLevel', 'info', 'Application log level', 'system');

-- =============================================================================
-- END OF UNIFIED SETUP SCRIPT
-- =============================================================================
