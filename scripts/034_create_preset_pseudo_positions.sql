-- Create preset_pseudo_positions table for async pseudo position tracking
-- Separate from indication validation - updated every 1 second

CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  preset_type_id TEXT NOT NULL,
  configuration_set_id TEXT,
  coordination_result_id TEXT,
  
  -- Position details
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Indication configuration
  indication_type TEXT NOT NULL,
  indication_params TEXT NOT NULL, -- JSON
  
  -- Position range configuration
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  
  -- Trailing configuration
  trailing_enabled INTEGER NOT NULL DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  
  -- Entry details
  entry_price REAL NOT NULL,
  quantity REAL NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  
  -- Current state (updated every 1 second)
  current_price REAL,
  unrealized_pnl REAL,
  unrealized_pnl_percent REAL,
  
  -- Exit details
  exit_price REAL,
  exit_reason TEXT,
  realized_pnl REAL,
  realized_pnl_percent REAL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  
  -- Timestamps
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_connection 
  ON preset_pseudo_positions(connection_id, preset_type_id);

CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_symbol 
  ON preset_pseudo_positions(symbol, status);

CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_status 
  ON preset_pseudo_positions(status);

CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_config 
  ON preset_pseudo_positions(
    symbol, indication_type, takeprofit_factor, stoploss_ratio, 
    direction, trailing_enabled, trail_start, trail_stop
  );

-- Comments
COMMENT ON TABLE preset_pseudo_positions IS 'Async pseudo positions updated every 1 second, separate from indication validation';
COMMENT ON COLUMN preset_pseudo_positions.status IS 'Position status: open (active), closed (TP/SL hit)';
COMMENT ON COLUMN preset_pseudo_positions.current_price IS 'Updated every 1 second by async manager';
