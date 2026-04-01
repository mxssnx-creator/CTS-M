-- Create preset_test_results table for storing configuration test results
CREATE TABLE IF NOT EXISTS preset_test_results (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  config_id VARCHAR(100) NOT NULL,
  
  -- Indicator configuration
  indicator_type VARCHAR(50) NOT NULL,
  indicator_params JSONB NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  
  -- Strategy configuration
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  
  -- Test results
  profit_factor DECIMAL(10, 4) NOT NULL,
  win_rate DECIMAL(5, 2) NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  avg_profit DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(5, 2) DEFAULT 0,
  drawdown_hours DECIMAL(10, 2) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  
  -- Validation status
  is_validated BOOLEAN DEFAULT false,
  validation_reason TEXT,
  
  -- Timestamps
  tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(preset_id, config_id)
);

CREATE INDEX idx_preset_test_results_preset ON preset_test_results(preset_id);
CREATE INDEX idx_preset_test_results_validated ON preset_test_results(is_validated);
CREATE INDEX idx_preset_test_results_profit_factor ON preset_test_results(profit_factor DESC);
CREATE INDEX idx_preset_test_results_symbol ON preset_test_results(symbol);
CREATE INDEX idx_preset_test_results_indicator ON preset_test_results(indicator_type);

-- Create preset_active_configs table for currently active configurations
CREATE TABLE IF NOT EXISTS preset_active_configs (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  config_id VARCHAR(100) NOT NULL,
  test_result_id INTEGER REFERENCES preset_test_results(id) ON DELETE CASCADE,
  
  -- Configuration details (denormalized for performance)
  indicator_type VARCHAR(50) NOT NULL,
  indicator_params JSONB NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) NOT NULL,
  win_rate DECIMAL(5, 2) NOT NULL,
  total_trades INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(preset_id, connection_id, config_id)
);

CREATE INDEX idx_preset_active_configs_preset ON preset_active_configs(preset_id);
CREATE INDEX idx_preset_active_configs_connection ON preset_active_configs(connection_id);
CREATE INDEX idx_preset_active_configs_symbol ON preset_active_configs(symbol);
CREATE INDEX idx_preset_active_configs_active ON preset_active_configs(is_active);

-- Create preset_trades table for tracking trades from preset configurations
CREATE TABLE IF NOT EXISTS preset_trades (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  active_config_id INTEGER REFERENCES preset_active_configs(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  
  -- Trade details
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  
  -- Strategy used
  indicator_type VARCHAR(50) NOT NULL,
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  
  -- Performance
  profit_loss DECIMAL(20, 8),
  profit_factor DECIMAL(10, 4),
  fees_paid DECIMAL(20, 8) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  close_reason VARCHAR(50),
  
  -- Timestamps
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preset_trades_preset ON preset_trades(preset_id);
CREATE INDEX idx_preset_trades_config ON preset_trades(active_config_id);
CREATE INDEX idx_preset_trades_connection ON preset_trades(connection_id);
CREATE INDEX idx_preset_trades_symbol ON preset_trades(symbol);
CREATE INDEX idx_preset_trades_status ON preset_trades(status);
CREATE INDEX idx_preset_trades_opened_at ON preset_trades(opened_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_preset_test_results_updated_at BEFORE UPDATE ON preset_test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
