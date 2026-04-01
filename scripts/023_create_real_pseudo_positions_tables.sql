-- Create real_pseudo_positions table for validated pseudo positions used in real trading
CREATE TABLE IF NOT EXISTS real_pseudo_positions (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  
  -- Configuration source
  base_config_id INTEGER, -- Reference to base pseudo position config
  main_config_id INTEGER, -- Reference to main strategy config
  
  -- Position details
  side VARCHAR(10) CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  position_cost DECIMAL(20, 8) NOT NULL,
  
  -- Strategy configuration
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  
  -- Adjustment strategies
  adjust_block_enabled BOOLEAN DEFAULT false,
  block_size INTEGER,
  block_adjustment_ratio DECIMAL(10, 4),
  adjust_dca_enabled BOOLEAN DEFAULT false,
  dca_levels INTEGER,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) NOT NULL,
  win_rate DECIMAL(5, 2),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  
  -- Validation
  is_validated BOOLEAN DEFAULT false,
  validation_profit_factor DECIMAL(10, 4),
  validation_drawdown_hours DECIMAL(10, 2),
  validated_at TIMESTAMP,
  
  -- Position state
  previous_positions_count INTEGER DEFAULT 0,
  last_position_state VARCHAR(20), -- 'won', 'loss'
  ongoing_positions_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'stopped')),
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  close_reason VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_real_pseudo_positions_connection ON real_pseudo_positions(connection_id);
CREATE INDEX idx_real_pseudo_positions_symbol ON real_pseudo_positions(symbol);
CREATE INDEX idx_real_pseudo_positions_status ON real_pseudo_positions(status);
CREATE INDEX idx_real_pseudo_positions_validated ON real_pseudo_positions(is_validated);
CREATE INDEX idx_real_pseudo_positions_opened_at ON real_pseudo_positions(opened_at DESC);

-- Create real_pseudo_position_logs table for detailed logging
CREATE TABLE IF NOT EXISTS real_pseudo_position_logs (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES real_pseudo_positions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'opened', 'updated', 'closed', 'validated', 'adjustment'
  price DECIMAL(20, 8),
  profit_loss DECIMAL(20, 8),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_real_pseudo_position_logs_position ON real_pseudo_position_logs(position_id);
CREATE INDEX idx_real_pseudo_position_logs_created_at ON real_pseudo_position_logs(created_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_real_pseudo_positions_updated_at BEFORE UPDATE ON real_pseudo_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
