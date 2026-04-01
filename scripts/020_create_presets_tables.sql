-- Create presets table for storing preset configurations
CREATE TABLE IF NOT EXISTS presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Indication filters
  indication_types JSONB DEFAULT '["direction", "move", "active"]'::jsonb,
  indication_ranges JSONB DEFAULT '[3, 5, 8, 12, 15, 20, 25, 30]'::jsonb,
  
  -- Strategy configuration (short-term trading up to 2 hours)
  takeprofit_steps JSONB DEFAULT '[2, 3, 4, 6, 8, 12]'::jsonb, -- In relation to 0.1% position cost
  stoploss_ratios JSONB DEFAULT '[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5]'::jsonb, -- Ratios from takeprofit
  
  -- Trailing configuration (same as pseudo positions)
  trailing_enabled BOOLEAN DEFAULT true,
  trail_starts JSONB DEFAULT '[0.3, 0.6, 1.0]'::jsonb,
  trail_stops JSONB DEFAULT '[0.1, 0.2, 0.3]'::jsonb,
  
  -- Strategy types
  strategy_types JSONB DEFAULT '["base", "main", "real"]'::jsonb,
  last_positions_counts JSONB DEFAULT '[3, 4, 5, 6, 8, 12, 25]'::jsonb,
  main_positions_count JSONB DEFAULT '[1, 2, 3, 4, 5]'::jsonb,
  
  -- Adjustment strategies
  block_adjustment_enabled BOOLEAN DEFAULT true,
  block_sizes JSONB DEFAULT '[2, 4, 6, 8]'::jsonb,
  block_adjustment_ratios JSONB DEFAULT '[0.5, 1.0, 1.5, 2.0]'::jsonb,
  
  dca_adjustment_enabled BOOLEAN DEFAULT false,
  dca_levels JSONB DEFAULT '[3, 5, 7]'::jsonb,
  
  -- Volume configuration
  volume_factors JSONB DEFAULT '[1, 2, 3, 4, 5]'::jsonb,
  
  -- Validation rules
  min_profit_factor DECIMAL(10, 4) DEFAULT 0.4,
  min_win_rate DECIMAL(5, 2) DEFAULT 0.0,
  max_drawdown DECIMAL(5, 2) DEFAULT 50.0,
  
  -- Backtesting configuration
  backtest_period_days INTEGER DEFAULT 30,
  backtest_enabled BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presets_active ON presets(is_active);
CREATE INDEX idx_presets_created_by ON presets(created_by);

-- Create preset_strategies table for storing validated strategies per preset
CREATE TABLE IF NOT EXISTS preset_strategies (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  
  -- Strategy configuration
  indication_type VARCHAR(50) NOT NULL,
  indication_range INTEGER NOT NULL,
  strategy_type VARCHAR(20) NOT NULL, -- base, main, real
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  
  -- Adjustment configuration
  block_adjustment_enabled BOOLEAN DEFAULT false,
  block_size INTEGER,
  block_adjustment_ratio DECIMAL(10, 4),
  dca_adjustment_enabled BOOLEAN DEFAULT false,
  dca_levels INTEGER,
  
  volume_factor DECIMAL(10, 4) DEFAULT 1.0,
  
  -- Performance metrics
  profit_factor DECIMAL(10, 4) NOT NULL,
  win_rate DECIMAL(5, 2),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  max_drawdown DECIMAL(5, 2),
  
  -- Validation status
  is_validated BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMP,
  validation_period_start TIMESTAMP,
  validation_period_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(preset_id, connection_id, symbol, indication_type, indication_range, 
         strategy_type, takeprofit_factor, stoploss_ratio, trailing_enabled)
);

CREATE INDEX idx_preset_strategies_preset ON preset_strategies(preset_id);
CREATE INDEX idx_preset_strategies_connection ON preset_strategies(connection_id);
CREATE INDEX idx_preset_strategies_symbol ON preset_strategies(symbol);
CREATE INDEX idx_preset_strategies_validated ON preset_strategies(is_validated);
CREATE INDEX idx_preset_strategies_profit_factor ON preset_strategies(profit_factor DESC);

-- Create trade_bots table for bot instances
CREATE TABLE IF NOT EXISTS trade_bots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  
  -- Bot configuration
  symbols JSONB DEFAULT '[]'::jsonb, -- Empty = use all symbols
  max_concurrent_positions INTEGER DEFAULT 50,
  position_timeout_hours INTEGER DEFAULT 2, -- Close positions after 2 hours
  
  -- Status
  status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  is_active BOOLEAN DEFAULT true,
  
  -- Statistics
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  current_positions INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  last_trade_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_bots_connection ON trade_bots(connection_id);
CREATE INDEX idx_trade_bots_status ON trade_bots(status);
CREATE INDEX idx_trade_bots_active ON trade_bots(is_active);

-- Create bot_preset_assignments table for linking bots to presets
CREATE TABLE IF NOT EXISTS bot_preset_assignments (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES trade_bots(id) ON DELETE CASCADE,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1, -- For multi-preset bots (lower = higher priority)
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(bot_id, preset_id)
);

CREATE INDEX idx_bot_preset_assignments_bot ON bot_preset_assignments(bot_id);
CREATE INDEX idx_bot_preset_assignments_preset ON bot_preset_assignments(preset_id);
CREATE INDEX idx_bot_preset_assignments_active ON bot_preset_assignments(is_active);

-- Create bot_trades table for tracking bot trade history
CREATE TABLE IF NOT EXISTS bot_trades (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES trade_bots(id) ON DELETE CASCADE,
  preset_id INTEGER REFERENCES presets(id) ON DELETE SET NULL,
  strategy_id INTEGER REFERENCES preset_strategies(id) ON DELETE SET NULL,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  
  -- Trade details
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  volume_factor DECIMAL(10, 4) DEFAULT 1.0,
  
  -- Strategy used
  indication_type VARCHAR(50),
  takeprofit_factor DECIMAL(10, 4),
  stoploss_ratio DECIMAL(10, 4),
  trailing_enabled BOOLEAN DEFAULT false,
  
  -- Performance
  profit_loss DECIMAL(20, 8),
  profit_factor DECIMAL(10, 4),
  fees_paid DECIMAL(20, 8) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  close_reason VARCHAR(50), -- takeprofit, stoploss, timeout, manual
  
  -- Timestamps
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_trades_bot ON bot_trades(bot_id);
CREATE INDEX idx_bot_trades_preset ON bot_trades(preset_id);
CREATE INDEX idx_bot_trades_connection ON bot_trades(connection_id);
CREATE INDEX idx_bot_trades_symbol ON bot_trades(symbol);
CREATE INDEX idx_bot_trades_status ON bot_trades(status);
CREATE INDEX idx_bot_trades_opened_at ON bot_trades(opened_at DESC);

-- Create backtest_results table for storing backtest data
CREATE TABLE IF NOT EXISTS backtest_results (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER REFERENCES presets(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  
  -- Backtest configuration
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  symbols JSONB NOT NULL,
  
  -- Performance metrics
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  
  -- Profit metrics
  total_profit DECIMAL(20, 8) DEFAULT 0,
  total_loss DECIMAL(20, 8) DEFAULT 0,
  net_profit DECIMAL(20, 8) DEFAULT 0,
  profit_factor DECIMAL(10, 4), -- total_profit / abs(total_loss)
  
  -- Drawdown metrics
  max_drawdown DECIMAL(5, 2),
  max_drawdown_duration_hours INTEGER,
  avg_drawdown DECIMAL(5, 2),
  
  -- Trade metrics
  avg_win DECIMAL(20, 8),
  avg_loss DECIMAL(20, 8),
  largest_win DECIMAL(20, 8),
  largest_loss DECIMAL(20, 8),
  avg_trade_duration_minutes INTEGER,
  
  -- Risk metrics
  sharpe_ratio DECIMAL(10, 4),
  sortino_ratio DECIMAL(10, 4),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_backtest_results_preset ON backtest_results(preset_id);
CREATE INDEX idx_backtest_results_connection ON backtest_results(connection_id);
CREATE INDEX idx_backtest_results_status ON backtest_results(status);
CREATE INDEX idx_backtest_results_profit_factor ON backtest_results(profit_factor DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preset_strategies_updated_at BEFORE UPDATE ON preset_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_bots_updated_at BEFORE UPDATE ON trade_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
