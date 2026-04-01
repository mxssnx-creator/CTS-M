-- Create table for storing historical data for preset coordination

CREATE TABLE IF NOT EXISTS preset_historical_data (
  id VARCHAR(21) PRIMARY KEY,
  connection_id VARCHAR(21) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  open DECIMAL(20,8) NOT NULL,
  high DECIMAL(20,8) NOT NULL,
  low DECIMAL(20,8) NOT NULL,
  close DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(connection_id, symbol, timestamp)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preset_historical_connection ON preset_historical_data(connection_id);
CREATE INDEX IF NOT EXISTS idx_preset_historical_symbol ON preset_historical_data(symbol);
CREATE INDEX IF NOT EXISTS idx_preset_historical_timestamp ON preset_historical_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_preset_historical_symbol_time ON preset_historical_data(symbol, timestamp);
