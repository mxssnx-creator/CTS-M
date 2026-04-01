-- Create trade_engine_state table for tracking engine status
CREATE TABLE IF NOT EXISTS trade_engine_state (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  last_indication_run TIMESTAMP,
  last_strategy_run TIMESTAMP,
  last_realtime_run TIMESTAMP,
  prehistoric_data_loaded BOOLEAN DEFAULT false,
  prehistoric_data_start TIMESTAMP,
  prehistoric_data_end TIMESTAMP,
  active_positions_count INTEGER DEFAULT 0,
  total_volume DECIMAL(20, 8) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id)
);

CREATE INDEX idx_trade_engine_state_connection ON trade_engine_state(connection_id);
CREATE INDEX idx_trade_engine_state_status ON trade_engine_state(status);

-- Create indications table for storing indication calculations
CREATE TABLE IF NOT EXISTS indications (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  indication_type VARCHAR(50) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  value DECIMAL(20, 8) NOT NULL,
  profit_factor DECIMAL(10, 4),
  confidence DECIMAL(5, 2),
  metadata JSONB,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indications_connection ON indications(connection_id);
CREATE INDEX idx_indications_symbol ON indications(symbol);
CREATE INDEX idx_indications_calculated_at ON indications(calculated_at DESC);

-- Create pseudo_positions table for paper trading
CREATE TABLE IF NOT EXISTS pseudo_positions (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  indication_type VARCHAR(50) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  position_cost DECIMAL(20, 8) NOT NULL,
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  profit_factor DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'stopped')),
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  close_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pseudo_positions_connection ON pseudo_positions(connection_id);
CREATE INDEX idx_pseudo_positions_symbol ON pseudo_positions(symbol);
CREATE INDEX idx_pseudo_positions_status ON pseudo_positions(status);
CREATE INDEX idx_pseudo_positions_opened_at ON pseudo_positions(opened_at DESC);

-- Create data_sync_log table for tracking data synchronization
CREATE TABLE IF NOT EXISTS data_sync_log (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'market_data', 'indication', 'position'
  sync_start TIMESTAMP NOT NULL,
  sync_end TIMESTAMP NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_sync_log_connection ON data_sync_log(connection_id);
CREATE INDEX idx_data_sync_log_symbol ON data_sync_log(symbol);
CREATE INDEX idx_data_sync_log_created_at ON data_sync_log(created_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_trade_engine_state_updated_at BEFORE UPDATE ON trade_engine_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pseudo_positions_updated_at BEFORE UPDATE ON pseudo_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
