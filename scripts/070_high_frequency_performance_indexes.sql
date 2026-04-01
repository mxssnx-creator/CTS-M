-- Migration 070: High-Frequency Performance Indexes
-- Optimizes for high-frequency trading operations with microsecond precision

-- Advanced indexes for ultra-fast symbol processing
CREATE INDEX IF NOT EXISTS idx_indications_hot_path 
  ON indications(connection_id, symbol, mode, calculated_at DESC, profit_factor DESC)
  WHERE calculated_at > NOW() - INTERVAL '5 minutes'
  AND profit_factor >= 0.7;

CREATE INDEX IF NOT EXISTS idx_indications_by_type_recent
  ON indications(connection_id, indication_type, symbol, calculated_at DESC)
  WHERE calculated_at > NOW() - INTERVAL '1 hour';

-- Strategy processing optimization indexes
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_symbol_mode_active
  ON pseudo_positions(connection_id, symbol, mode, status, created_at DESC)
  WHERE status = 'active' AND created_at > NOW() - INTERVAL '1 hour';

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_validation_queue
  ON pseudo_positions(connection_id, symbol, mode, profit_factor DESC, created_at ASC)
  WHERE status = 'active' AND profit_factor >= 0.6;

-- Real-time position update indexes for sub-second latency
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_exchange_sync
  ON real_pseudo_positions(connection_id, symbol, status, validated_at DESC)
  WHERE status = 'validated';

CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_realtime
  ON active_exchange_positions(connection_id, exchange_position_id, last_sync_at DESC)
  WHERE sync_status = 'synced';

-- Trade engine state monitoring indexes
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_health
  ON trade_engine_state(connection_id, status, last_preset_run DESC, last_main_run DESC);

CREATE INDEX IF NOT EXISTS idx_trade_engine_state_performance
  ON trade_engine_state(connection_id, preset_cycle_duration_ms ASC, main_cycle_duration_ms ASC)
  WHERE status = 'running';

-- Symbol-level concurrency indexes
CREATE INDEX IF NOT EXISTS idx_trade_logs_symbol_recent
  ON trade_logs(connection_id, symbol, mode, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '10 minutes';

-- Data cleanup and retention indexes
CREATE INDEX IF NOT EXISTS idx_indications_cleanup
  ON indications(calculated_at) 
  WHERE calculated_at < NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_cleanup
  ON pseudo_positions(created_at)
  WHERE status IN ('closed', 'cancelled') AND created_at < NOW() - INTERVAL '30 days';

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_indications_strategy_matching
  ON indications(connection_id, symbol, indication_type, profit_factor DESC, confidence DESC, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_pnl_tracking
  ON pseudo_positions(connection_id, symbol, side, profit_factor, current_pnl, status)
  WHERE status = 'active';

-- Async processing queue indexes
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_processing_queue
  ON pseudo_positions(connection_id, updated_at ASC)
  WHERE status = 'active' AND updated_at < NOW() - INTERVAL '30 seconds';

-- Market data hot cache indexes
CREATE INDEX IF NOT EXISTS idx_market_data_latest_by_symbol
  ON market_data(symbol, timestamp DESC, close, volume, high, low)
  WHERE timestamp > NOW() - INTERVAL '1 hour';

-- Connection-specific symbol lists
CREATE INDEX IF NOT EXISTS idx_exchange_connections_active
  ON exchange_connections(id, exchange, is_enabled, is_active)
  WHERE (is_enabled = 1 OR is_enabled = true) 
  AND (is_active = 1 OR is_active = true);
