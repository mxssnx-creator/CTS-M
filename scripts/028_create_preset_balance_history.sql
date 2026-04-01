-- Create table for tracking balance and equity history over time
CREATE TABLE IF NOT EXISTS preset_balance_history (
  id SERIAL PRIMARY KEY,
  preset_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  balance DECIMAL(20, 8) NOT NULL,
  equity DECIMAL(20, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(preset_id, symbol, timestamp)
);

CREATE INDEX idx_preset_balance_history_preset_symbol ON preset_balance_history(preset_id, symbol);
CREATE INDEX idx_preset_balance_history_timestamp ON preset_balance_history(timestamp DESC);

COMMENT ON TABLE preset_balance_history IS 'Tracks balance and equity snapshots over time for chart visualization';
