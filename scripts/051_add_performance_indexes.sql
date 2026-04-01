-- Migration 051: Add performance indexes for frequent queries
-- Addresses: Performance optimization for position queries with LIMIT

-- Add indexes for pseudo_positions with common query patterns
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_connection_status_level 
  ON pseudo_positions(connection_id, status, level) 
  WHERE status IN ('evaluating', 'active');

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position 
  ON pseudo_positions(base_position_id, status);

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_performance 
  ON pseudo_positions(connection_id, win_rate DESC, profit_factor DESC) 
  WHERE status = 'active';

-- Add indexes for base_pseudo_positions
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_indication 
  ON base_pseudo_positions(indication_id, status, total_positions);

CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_performance 
  ON base_pseudo_positions(indication_id, win_rate DESC, drawdown_max ASC) 
  WHERE status = 'active';

-- Add indexes for real_pseudo_positions
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_main_position 
  ON real_pseudo_positions(main_position_id, status);

CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_performance 
  ON real_pseudo_positions(connection_id, profit_factor DESC, drawdown_time_hours ASC) 
  WHERE status = 'validated';

-- Add indexes for active_exchange_positions
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_real_position 
  ON active_exchange_positions(real_pseudo_position_id, status);

CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_sync 
  ON active_exchange_positions(connection_id, sync_status, last_sync_at);

CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_performance 
  ON active_exchange_positions(connection_id, pnl_usdt DESC, win_count DESC);

-- Add indexes for indication_states
CREATE INDEX IF NOT EXISTS idx_indication_states_symbol_type 
  ON indication_states(connection_id, symbol, indication_type, validated_at DESC);

CREATE INDEX IF NOT EXISTS idx_indication_states_cooldown 
  ON indication_states(connection_id, symbol, indication_type, cooldown_until);

-- Add composite index for trade engine queries
CREATE INDEX IF NOT EXISTS idx_trade_engine_active_positions 
  ON pseudo_positions(connection_id, symbol, status, level, created_at DESC)
  WHERE status = 'active';

-- Add index for preset coordination results
CREATE INDEX IF NOT EXISTS idx_preset_coordination_symbol_valid 
  ON preset_coordination_results(preset_type_id, symbol, is_valid, profit_factor DESC);

-- Add index for market data lookups
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp 
  ON market_data(symbol, timestamp DESC)
  INCLUDE (close, volume);
