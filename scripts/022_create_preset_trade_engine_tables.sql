-- Preset Trade Engine State
CREATE TABLE IF NOT EXISTS preset_trade_engine_state (
  connection_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped', -- running, stopped, error
  testing_progress INTEGER DEFAULT 0, -- 0-100
  testing_message TEXT,
  error_message TEXT,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (connection_id, preset_id)
);

-- Preset Trades
CREATE TABLE IF NOT EXISTS preset_trades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  preset_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- long, short
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  takeprofit DECIMAL(20, 8),
  stoploss DECIMAL(20, 8),
  trailing_enabled BOOLEAN DEFAULT false,
  indicator_type TEXT NOT NULL,
  indicator_params JSONB NOT NULL,
  profit_loss DECIMAL(20, 8),
  fees_paid DECIMAL(20, 8) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, cancelled
  close_reason TEXT, -- takeprofit, stoploss, timeout, manual
  opened_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preset_trades_preset ON preset_trades(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_trades_connection ON preset_trades(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_trades_symbol ON preset_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_trades_status ON preset_trades(status);
CREATE INDEX IF NOT EXISTS idx_preset_trades_opened ON preset_trades(opened_at);
