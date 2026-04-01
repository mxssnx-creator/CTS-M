-- Create active exchange positions table
-- These are real positions mirrored from Real Pseudo Positions after validation
-- Includes unique exchange IDs for coordination and statistics tracking

CREATE TABLE IF NOT EXISTS active_exchange_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  real_pseudo_position_id TEXT NOT NULL, -- Link to real_pseudo_positions
  main_pseudo_position_id TEXT, -- Link to main pseudo (from pseudo_positions)
  base_pseudo_position_id TEXT, -- Link to base pseudo (from base_pseudo_positions if Optimal)
  
  -- Exchange information
  exchange_id TEXT NOT NULL UNIQUE, -- Unique ID from exchange (e.g., Bybit order ID)
  exchange_order_id TEXT, -- Original order ID
  exchange_position_id TEXT, -- Position ID if different from order ID
  
  -- Position details
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  position_type TEXT DEFAULT 'market', -- market, limit, stop
  
  -- Pricing and volume
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  quantity REAL NOT NULL,
  volume_usd REAL NOT NULL,
  leverage INTEGER DEFAULT 1,
  
  -- Risk management
  takeprofit REAL,
  stoploss REAL,
  trailing_enabled BOOLEAN DEFAULT 0,
  trail_start REAL,
  trail_stop REAL,
  trail_activated BOOLEAN DEFAULT 0,
  trail_high_price REAL, -- Highest price since trail activation
  
  -- Performance tracking
  unrealized_pnl REAL DEFAULT 0,
  realized_pnl REAL DEFAULT 0,
  fees_paid REAL DEFAULT 0,
  funding_fees REAL DEFAULT 0,
  
  -- Statistics
  max_profit REAL DEFAULT 0, -- Peak profit during position lifetime
  max_loss REAL DEFAULT 0, -- Maximum loss during position lifetime
  max_drawdown REAL DEFAULT 0, -- Max drawdown from peak
  price_high REAL, -- Highest price reached
  price_low REAL, -- Lowest price reached
  
  -- Status and timing
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'cancelled', 'liquidated')),
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  hold_duration_seconds INTEGER, -- Duration in seconds when closed
  
  -- Coordination flags
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_update', 'error', 'out_of_sync')),
  last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_error_message TEXT,
  sync_retry_count INTEGER DEFAULT 0,
  
  -- Mode tracking
  trade_mode TEXT NOT NULL CHECK (trade_mode IN ('preset', 'main')),
  indication_type TEXT, -- direction, move, active, optimal (for main mode)
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id),
  FOREIGN KEY (real_pseudo_position_id) REFERENCES real_pseudo_positions(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_connection ON active_exchange_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_exchange_id ON active_exchange_positions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_symbol ON active_exchange_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_status ON active_exchange_positions(status);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_real_pseudo ON active_exchange_positions(real_pseudo_position_id);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_sync_status ON active_exchange_positions(sync_status);
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_opened_at ON active_exchange_positions(opened_at);

-- Create exchange position statistics table
-- Aggregated performance metrics per symbol/indication type
CREATE TABLE IF NOT EXISTS exchange_position_statistics (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT, -- direction, move, active, optimal, or NULL for preset
  trade_mode TEXT NOT NULL CHECK (trade_mode IN ('preset', 'main')),
  
  -- Time window
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  period_hours INTEGER NOT NULL, -- Duration in hours
  
  -- Position counts
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  cancelled_positions INTEGER DEFAULT 0,
  liquidated_positions INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_pnl REAL DEFAULT 0,
  total_fees REAL DEFAULT 0,
  net_pnl REAL DEFAULT 0,
  win_rate REAL DEFAULT 0, -- winning / (winning + losing)
  profit_factor REAL DEFAULT 0, -- total_wins / abs(total_losses)
  
  -- Average metrics
  avg_winning_pnl REAL DEFAULT 0,
  avg_losing_pnl REAL DEFAULT 0,
  avg_hold_duration_seconds INTEGER DEFAULT 0,
  
  -- Best/worst
  best_trade_pnl REAL DEFAULT 0,
  worst_trade_pnl REAL DEFAULT 0,
  
  -- Risk metrics
  max_drawdown REAL DEFAULT 0,
  avg_drawdown REAL DEFAULT 0,
  sharpe_ratio REAL, -- Risk-adjusted return
  
  -- Volume metrics
  total_volume_usd REAL DEFAULT 0,
  avg_position_size_usd REAL DEFAULT 0,
  
  -- Updated tracking
  last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  position_count_at_calc INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id),
  UNIQUE(connection_id, symbol, indication_type, trade_mode, period_start)
);

-- Indexes for statistics
CREATE INDEX IF NOT EXISTS idx_exchange_stats_connection ON exchange_position_statistics(connection_id);
CREATE INDEX IF NOT EXISTS idx_exchange_stats_symbol ON exchange_position_statistics(symbol);
CREATE INDEX IF NOT EXISTS idx_exchange_stats_indication_type ON exchange_position_statistics(indication_type);
CREATE INDEX IF NOT EXISTS idx_exchange_stats_period ON exchange_position_statistics(period_start, period_end);

-- Create exchange position coordination log
-- Tracks all synchronization events between system and exchange
CREATE TABLE IF NOT EXISTS exchange_position_coordination_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  exchange_id TEXT,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'position_opened', 'position_updated', 'position_closed',
    'sync_success', 'sync_failed', 'price_updated',
    'trailing_activated', 'trailing_adjusted',
    'stop_loss_hit', 'take_profit_hit', 'manual_close'
  )),
  
  -- Event data
  event_data TEXT, -- JSON with details
  old_state TEXT, -- Previous state (JSON)
  new_state TEXT, -- New state (JSON)
  
  -- Status
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  
  -- Timing
  event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  processing_duration_ms INTEGER,
  
  -- Metadata
  triggered_by TEXT, -- 'system', 'exchange', 'manual'
  
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id)
);

-- Index for coordination log
CREATE INDEX IF NOT EXISTS idx_coordination_log_connection ON exchange_position_coordination_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_coordination_log_exchange_id ON exchange_position_coordination_log(exchange_id);
CREATE INDEX IF NOT EXISTS idx_coordination_log_event_type ON exchange_position_coordination_log(event_type);
CREATE INDEX IF NOT EXISTS idx_coordination_log_timestamp ON exchange_position_coordination_log(event_timestamp);

-- Create view for active position monitoring
CREATE VIEW IF NOT EXISTS v_active_exchange_positions_monitoring AS
SELECT 
  aep.id,
  aep.connection_id,
  aep.exchange_id,
  aep.symbol,
  aep.side,
  aep.trade_mode,
  aep.indication_type,
  aep.entry_price,
  aep.current_price,
  aep.quantity,
  aep.unrealized_pnl,
  aep.unrealized_pnl / (aep.entry_price * aep.quantity) * 100 as pnl_percentage,
  aep.max_profit,
  aep.max_loss,
  aep.status,
  aep.sync_status,
  CAST((julianday('now') - julianday(aep.opened_at)) * 24 * 60 * 60 AS INTEGER) as hold_duration_seconds,
  CASE 
    WHEN aep.unrealized_pnl > 0 THEN 'winning'
    WHEN aep.unrealized_pnl < 0 THEN 'losing'
    ELSE 'breakeven'
  END as current_status,
  rpp.profit_factor as real_pseudo_profit_factor,
  aep.opened_at,
  aep.last_updated_at
FROM active_exchange_positions aep
LEFT JOIN real_pseudo_positions rpp ON aep.real_pseudo_position_id = rpp.id
WHERE aep.status = 'open';
