-- Preset Trade Engine State
CREATE TABLE IF NOT EXISTS preset_trade_engine_state (
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'automatic',
  status TEXT NOT NULL DEFAULT 'stopped',
  config JSONB,
  testing_progress INTEGER DEFAULT 0,
  testing_message TEXT,
  error_message TEXT,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (connection_id, preset_id)
);

-- Preset Pseudo Positions (Base, Main, Real)
CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('base', 'main', 'real')),
  indication_type TEXT NOT NULL CHECK (indication_type IN ('direction', 'move', 'active')),
  indication_range INTEGER NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL DEFAULT 0,
  position_cost REAL NOT NULL DEFAULT 0.001,
  base_position_id TEXT,
  main_position_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  profit_loss REAL,
  close_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_connection ON preset_pseudo_positions(connection_id, preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_symbol ON preset_pseudo_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_type ON preset_pseudo_positions(type, status);

-- Preset Symbol Performance
CREATE TABLE IF NOT EXISTS preset_symbol_performance (
  id SERIAL PRIMARY KEY,
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  profit_factor_12 REAL,
  profit_factor_25 REAL,
  profit_factor_50 REAL,
  pnl_4h REAL,
  pnl_12h REAL,
  pnl_24h REAL,
  drawdown_time_hours REAL,
  last_120_positions INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id, preset_id, symbol)
);

-- Preset Engine Metrics
CREATE TABLE IF NOT EXISTS preset_engine_metrics (
  id SERIAL PRIMARY KEY,
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  symbol_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preset_engine_metrics_timestamp ON preset_engine_metrics(timestamp DESC);

-- Top Symbols by Market Cap
CREATE TABLE IF NOT EXISTS top_symbols_market_cap (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  market_cap_change_24h REAL NOT NULL,
  volume_24h REAL NOT NULL,
  rank INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol)
);

CREATE INDEX IF NOT EXISTS idx_top_symbols_rank ON top_symbols_market_cap(rank);
