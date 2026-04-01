-- SQLite Database Initialization Script
-- Converted from PostgreSQL to SQLite syntax

-- Enable foreign keys
PRAGMA foreign_keys = ON;

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

-- Exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  websocket_url TEXT,
  supports_spot INTEGER DEFAULT 1,
  supports_futures INTEGER DEFAULT 0,
  supports_margin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Exchange connections table
CREATE TABLE IF NOT EXISTS exchange_connections (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_type TEXT NOT NULL,
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
  preset_type_id INTEGER,
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

-- Trade engine state table
CREATE TABLE IF NOT EXISTS trade_engine_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
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
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_engine_state_connection ON trade_engine_state(connection_id);
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_status ON trade_engine_state(status);

-- Indications table
CREATE TABLE IF NOT EXISTS indications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  value REAL NOT NULL,
  profit_factor REAL,
  confidence REAL,
  metadata TEXT,
  calculated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_indications_connection ON indications(connection_id);
CREATE INDEX IF NOT EXISTS idx_indications_symbol ON indications(symbol);
CREATE INDEX IF NOT EXISTS idx_indications_calculated_at ON indications(calculated_at DESC);

-- Pseudo positions table
CREATE TABLE IF NOT EXISTS pseudo_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,
  side TEXT CHECK (side IN ('long', 'short')),
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  quantity REAL NOT NULL,
  position_cost REAL NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  profit_factor REAL NOT NULL,
  trailing_enabled INTEGER DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'stopped')),
  opened_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  close_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_connection ON pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_symbol ON pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_status ON pseudo_positions(status);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_opened_at ON pseudo_positions(opened_at DESC);

-- Real pseudo positions table
CREATE TABLE IF NOT EXISTS real_pseudo_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  indication_id INTEGER,
  strategy_id INTEGER,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('long', 'short')),
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  quantity REAL NOT NULL,
  position_cost REAL NOT NULL,
  unrealized_pnl REAL DEFAULT 0,
  realized_pnl REAL DEFAULT 0,
  takeprofit_price REAL,
  stoploss_price REAL,
  trailing_enabled INTEGER DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  trail_update REAL,
  highest_price REAL,
  lowest_price REAL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  close_reason TEXT,
  opened_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_connection ON real_pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_symbol ON real_pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_status ON real_pseudo_positions(status);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  symbol TEXT,
  timeframe TEXT,
  is_enabled INTEGER DEFAULT 1,
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strategies_connection ON strategies(connection_id);
CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON strategies(is_enabled);

-- Presets table
CREATE TABLE IF NOT EXISTS presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  indication_types TEXT DEFAULT '["direction","move","active"]',
  indication_ranges TEXT DEFAULT '[3,5,8,12,15,20,25,30]',
  position_ranges TEXT DEFAULT '{}',
  takeprofit_steps TEXT DEFAULT '[2,3,4,6,8,12]',
  stoploss_ratios TEXT DEFAULT '[0.2,0.4,0.6,0.8,1.0,1.2,1.5]',
  trailing_enabled INTEGER DEFAULT 0,
  trail_starts TEXT DEFAULT '[0.3,0.6,1.0]',
  trail_stops TEXT DEFAULT '[0.1,0.2,0.3]',
  strategy_types TEXT DEFAULT '["base","partial","count"]',
  last_positions_counts TEXT DEFAULT '[3,4,5,6,8,12,25]',
  partial_positions_counts TEXT DEFAULT '[1,2,3,4,5]',
  block_enabled INTEGER DEFAULT 0,
  block_sizes TEXT DEFAULT '[2,4,6,8]',
  block_adjustment_ratios TEXT DEFAULT '[0.5,1.0,1.5,2.0]',
  dca_enabled INTEGER DEFAULT 0,
  dca_levels TEXT DEFAULT '[3,5,7]',
  volume_factors TEXT DEFAULT '[1,2,3,4,5]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Preset types table (new coordination system)
CREATE TABLE IF NOT EXISTS preset_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  symbol_selection_mode TEXT DEFAULT 'manual' CHECK (symbol_selection_mode IN ('manual', 'market_cap', 'volume', 'change')),
  symbols TEXT DEFAULT '[]',
  symbol_limit INTEGER DEFAULT 10,
  evaluation_update_interval INTEGER DEFAULT 10800,
  position_timeout INTEGER DEFAULT 5,
  coordination_timeout INTEGER DEFAULT 10,
  max_positions_per_config INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Configuration sets table
CREATE TABLE IF NOT EXISTS configuration_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  indication_type TEXT NOT NULL,
  indication_params TEXT DEFAULT '{}',
  indication_ranges TEXT DEFAULT '{}',
  position_ranges TEXT DEFAULT '{}',
  trailing_config TEXT DEFAULT '{}',
  calculation_settings TEXT DEFAULT '{}',
  evaluation_settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Preset type sets junction table
CREATE TABLE IF NOT EXISTS preset_type_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_type_id INTEGER REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id INTEGER REFERENCES configuration_sets(id) ON DELETE CASCADE,
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(preset_type_id, configuration_set_id)
);

-- Preset coordination results table
CREATE TABLE IF NOT EXISTS preset_coordination_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_type_id INTEGER REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id INTEGER REFERENCES configuration_sets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  indication_params TEXT,
  position_range TEXT,
  trailing_config TEXT,
  positions_24h INTEGER DEFAULT 0,
  profit_factor REAL DEFAULT 0,
  drawdown_time REAL DEFAULT 0,
  last_25_profit REAL DEFAULT 0,
  last_50_profit REAL DEFAULT 0,
  overall_profit REAL DEFAULT 0,
  is_valid INTEGER DEFAULT 0,
  calculated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_preset ON preset_coordination_results(preset_type_id);
CREATE INDEX IF NOT EXISTS idx_preset_coordination_results_config ON preset_coordination_results(configuration_set_id);

-- Preset real trades table
CREATE TABLE IF NOT EXISTS preset_real_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT REFERENCES exchange_connections(id) ON DELETE CASCADE,
  preset_type_id INTEGER REFERENCES preset_types(id) ON DELETE CASCADE,
  configuration_set_id INTEGER REFERENCES configuration_sets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('long', 'short')),
  entry_price REAL NOT NULL,
  exit_price REAL,
  quantity REAL NOT NULL,
  pnl REAL DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_preset_real_trades_connection ON preset_real_trades(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_real_trades_preset ON preset_real_trades(preset_type_id);

-- Site logs table
CREATE TABLE IF NOT EXISTS site_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT (datetime('now')),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level);
CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(connection_id, indication_type, symbol, direction, position_range)
);

CREATE INDEX IF NOT EXISTS idx_indication_states_connection ON indication_states(connection_id);

-- Position limit tracking table
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

CREATE INDEX IF NOT EXISTS idx_historical_data_connection ON historical_data(connection_id);
CREATE INDEX IF NOT EXISTS idx_historical_data_symbol ON historical_data(symbol);
CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp ON historical_data(timestamp DESC);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
  ('preset_evaluation_interval', '10800', 'Preset evaluation update interval in seconds (default: 3 hours)'),
  ('preset_position_threshold', '250', 'Number of positions for preset evaluation threshold'),
  ('preset_profit_threshold', '0.2', 'Profit threshold for preset validation (20%)'),
  ('max_positions_per_config', '1', 'Maximum positions per configuration combination'),
  ('position_timeout', '5', 'Timeout between positions for same indication (seconds)'),
  ('coordination_timeout', '10', 'Timeout after position for coordination (seconds)');
