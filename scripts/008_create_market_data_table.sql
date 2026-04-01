-- Create market_data table for storing historical price data
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  trading_pair_id INTEGER REFERENCES trading_pairs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  interval VARCHAR(10) CHECK (interval IN ('1m', '5m', '15m', '1h', '4h', '1d')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trading_pair_id, timestamp, interval)
);

CREATE INDEX idx_market_data_pair_timestamp ON market_data(trading_pair_id, timestamp DESC);
CREATE INDEX idx_market_data_interval ON market_data(interval);
