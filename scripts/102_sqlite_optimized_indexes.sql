-- Migration 102: SQLite-Specific Optimized Indexes
-- Additional indexes specifically optimized for SQLite and this application's query patterns
-- Focus on high-cardinality queries and common filtering operations

-- =============================================================================
-- CORE HIGH-PERFORMANCE INDEXES (SQLite Optimized)
-- =============================================================================

-- Exchange connections - active status queries (very common)
CREATE INDEX IF NOT EXISTS idx_connections_active_fast 
  ON exchange_connections(is_active, is_enabled, id)
  WHERE is_active = 1 AND is_enabled = 1;

-- Indication state lookups - most frequent queries
CREATE INDEX IF NOT EXISTS idx_indications_direction_latest 
  ON indications_direction(connection_id, symbol, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_indications_move_latest 
  ON indications_move(connection_id, symbol, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_indications_active_latest 
  ON indications_active(connection_id, symbol, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_indications_optimal_latest 
  ON indications_optimal(connection_id, symbol, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_indications_auto_latest 
  ON indications_auto(connection_id, symbol, status)
  WHERE status = 'active';

-- Strategy lookups
CREATE INDEX IF NOT EXISTS idx_strategies_base_active 
  ON strategies_base(connection_id, symbol, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_strategies_main_active 
  ON strategies_main(connection_id, symbol, status)
  WHERE status = 'active';

-- Pseudo positions - very high query volume
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_fast_lookup 
  ON pseudo_positions(connection_id, symbol, side, mode)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_pnl 
  ON pseudo_positions(connection_id, current_pnl DESC, profit_factor DESC)
  WHERE status = 'active';

-- Real pseudo positions
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_sync 
  ON real_pseudo_positions(connection_id, status, validated_at DESC);

-- Active exchange positions
CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_sync 
  ON active_exchange_positions(connection_id, exchange_position_id)
  WHERE sync_status = 'synced';

-- =============================================================================
-- TIME-SERIES AND HISTORICAL QUERIES
-- =============================================================================

-- Trade logs by time
CREATE INDEX IF NOT EXISTS idx_trade_logs_time_range 
  ON trade_logs(connection_id, symbol, created_at DESC)
  WHERE created_at > datetime('now', '-1 day');

-- Market data time-series optimization
CREATE INDEX IF NOT EXISTS idx_market_data_timerange 
  ON market_data(symbol, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_data_recent 
  ON market_data(symbol, timestamp DESC)
  WHERE timestamp > datetime('now', '-24 hours');

-- Order history
CREATE INDEX IF NOT EXISTS idx_orders_history 
  ON orders(connection_id, created_at DESC, status);

-- =============================================================================
-- COORDINATION AND STATE TRACKING
-- =============================================================================

-- Connection coordination state
CREATE INDEX IF NOT EXISTS idx_connection_coordination_state 
  ON connection_coordination(status, last_heartbeat DESC);

-- Trade engine state
CREATE INDEX IF NOT EXISTS idx_trade_engine_state_monitoring 
  ON trade_engine_state(connection_id, status, last_main_run DESC);

-- =============================================================================
-- PERFORMANCE METRICS AND ANALYTICS
-- =============================================================================

-- Performance metrics queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_lookup 
  ON performance_metrics(connection_id, symbol, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_recent 
  ON performance_metrics(connection_id, calculated_at DESC)
  WHERE calculated_at > datetime('now', '-7 days');

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_lookup 
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON audit_logs(action, created_at DESC);

-- =============================================================================
-- SYSTEM MONITORING
-- =============================================================================

-- Site logs for debugging
CREATE INDEX IF NOT EXISTS idx_site_logs_recent 
  ON site_logs(level, category, timestamp DESC)
  WHERE timestamp > datetime('now', '-1 day');

CREATE INDEX IF NOT EXISTS idx_site_logs_connection_trace 
  ON site_logs(connection_id, timestamp DESC)
  WHERE connection_id IS NOT NULL;

-- System settings lookup
CREATE INDEX IF NOT EXISTS idx_system_settings_lookup 
  ON system_settings(key);

CREATE INDEX IF NOT EXISTS idx_system_settings_category_lookup 
  ON system_settings(category);

-- =============================================================================
-- PRESET AND CONFIGURATION TABLES
-- =============================================================================

-- Preset lookups
CREATE INDEX IF NOT EXISTS idx_presets_active 
  ON presets(connection_id, is_active)
  WHERE is_active = 1;

CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_lookup 
  ON preset_pseudo_positions(preset_id, symbol, status)
  WHERE status = 'active';

-- Preset trade engine
CREATE INDEX IF NOT EXISTS idx_preset_trade_engine_state 
  ON preset_trade_engine(preset_id, status, last_run DESC);

-- =============================================================================
-- INDICATION STATE MANAGEMENT (for indication_state_manager)
-- =============================================================================

-- Indication state lookups (used frequently by indication_state_manager)
CREATE INDEX IF NOT EXISTS idx_indication_states_lookup 
  ON indication_states(connection_id, symbol, indication_type)
  WHERE is_active = 1;

CREATE INDEX IF NOT EXISTS idx_indication_states_update 
  ON indication_states(connection_id, last_updated DESC)
  WHERE is_active = 1;

-- =============================================================================
-- VERIFICATION AND CLEANUP
-- =============================================================================

-- Indexes for data retention and cleanup
CREATE INDEX IF NOT EXISTS idx_indications_old_data 
  ON indications_direction(calculated_at)
  WHERE calculated_at < datetime('now', '-30 days');

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_old_data 
  ON pseudo_positions(created_at)
  WHERE status IN ('closed', 'cancelled');

-- =============================================================================
-- UNIQUE CONSTRAINTS (ensuring data integrity)
-- =============================================================================

-- Already defined in schema but here for documentation:
-- UNIQUE(connection_id, symbol, mode) on pseudo_positions
-- UNIQUE(name, preset_type) on exchange_connections
-- UNIQUE(key) on system_settings
