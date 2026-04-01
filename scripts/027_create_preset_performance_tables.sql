-- Create tables for preset symbol performance tracking

CREATE TABLE IF NOT EXISTS preset_symbol_performance (
  id SERIAL PRIMARY KEY,
  preset_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  profit_factor_12 DECIMAL(10,4) DEFAULT 0,
  profit_factor_25 DECIMAL(10,4) DEFAULT 0,
  avg_profit_factor_50 DECIMAL(10,4) DEFAULT 0,
  max_drawdown_hours DECIMAL(10,2) DEFAULT 0,
  valid_config_count INTEGER DEFAULT 0,
  pnl_4h DECIMAL(10,4) DEFAULT 0,
  pnl_12h DECIMAL(10,4) DEFAULT 0,
  pnl_24h DECIMAL(10,4) DEFAULT 0,
  pnl_48h DECIMAL(10,4) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(preset_id, symbol)
);

CREATE INDEX idx_preset_symbol_performance_preset ON preset_symbol_performance(preset_id);
CREATE INDEX idx_preset_symbol_performance_symbol ON preset_symbol_performance(symbol);
CREATE INDEX idx_preset_symbol_performance_pf50 ON preset_symbol_performance(avg_profit_factor_50 DESC);

-- Create table for top symbols by market cap
CREATE TABLE IF NOT EXISTS market_cap_rankings (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  market_cap_change_24h DECIMAL(10,4) NOT NULL,
  volume_24h DECIMAL(20,2) NOT NULL,
  rank INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_cap_rankings_timestamp ON market_cap_rankings(timestamp DESC);
CREATE INDEX idx_market_cap_rankings_rank ON market_cap_rankings(rank);

COMMENT ON TABLE preset_symbol_performance IS 'Tracks performance metrics for each symbol in preset configurations';
COMMENT ON TABLE market_cap_rankings IS 'Stores top symbols ranked by 24h market cap change for preset trading';
