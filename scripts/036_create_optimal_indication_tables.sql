-- Create base_pseudo_positions table for Optimal indication type
-- Implements 250-limit base configuration layer with performance tracking

CREATE TABLE IF NOT EXISTS base_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL, -- Changed from INTEGER to TEXT to match exchange_connections.id
  symbol VARCHAR(20) NOT NULL,
  indication_type VARCHAR(50) NOT NULL CHECK (indication_type = 'optimal'),
  indication_range INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Core configuration parameters
  drawdown_ratio DECIMAL(5, 2) NOT NULL,
  market_change_range INTEGER NOT NULL,
  last_part_ratio DECIMAL(5, 2) NOT NULL,
  
  -- Active-specific parameters (nullable for direction/move)
  activity_calculated INTEGER,
  activity_lastpart INTEGER,
  
  -- Performance metrics
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  total_profit_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(10, 4) DEFAULT 0,
  win_rate DECIMAL(5, 4) DEFAULT 0,
  avg_profit DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'evaluating' CHECK (status IN ('evaluating', 'active', 'paused', 'failed')),
  evaluation_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure uniqueness per configuration
  UNIQUE(connection_id, symbol, indication_type, indication_range, direction, 
         drawdown_ratio, market_change_range, last_part_ratio)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_connection ON base_pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_symbol ON base_pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_status ON base_pseudo_positions(status);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_indication ON base_pseudo_positions(indication_type, indication_range);

-- Add base_position_id foreign key to pseudo_positions table
-- Changed from INTEGER to TEXT
ALTER TABLE pseudo_positions 
  ADD COLUMN IF NOT EXISTS base_position_id TEXT;

-- Add configuration columns to pseudo_positions for filtering
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS drawdown_ratio DECIMAL(5, 2);
  
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS market_change_range INTEGER;
  
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS last_part_ratio DECIMAL(5, 2);

-- Add direction column to pseudo_positions
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS direction VARCHAR(10);

-- Add indication_range column to pseudo_positions
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS indication_range INTEGER;

-- Create index for base position lookup
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position ON pseudo_positions(base_position_id);

-- Create index for configuration filtering
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_config ON pseudo_positions(
  symbol, indication_type, direction, drawdown_ratio, market_change_range, last_part_ratio
);

-- Removed trigger creation - function doesn't exist and will cause errors
-- Triggers should be added separately if needed with proper function definitions

-- Create view for base position performance summary
CREATE OR REPLACE VIEW base_position_performance AS
SELECT 
  bp.id,
  bp.symbol,
  bp.indication_type,
  bp.indication_range,
  bp.direction,
  bp.drawdown_ratio,
  bp.market_change_range,
  bp.last_part_ratio,
  bp.status,
  bp.total_positions,
  bp.winning_positions,
  bp.losing_positions,
  bp.win_rate,
  bp.avg_profit,
  bp.avg_loss,
  bp.max_drawdown,
  COUNT(pp.id) as linked_positions,
  SUM(CASE WHEN pp.status = 'active' THEN 1 ELSE 0 END) as active_positions,
  SUM(CASE WHEN pp.status = 'closed' THEN 1 ELSE 0 END) as closed_positions
FROM base_pseudo_positions bp
LEFT JOIN pseudo_positions pp ON bp.id = pp.base_position_id
GROUP BY bp.id;
