/**
 * Redis Database Schema - Complete System Documentation
 * Defines all data structures, relationships, indexes, and integrity constraints
 */

// ============================================================================
// 1. CONNECTIONS (Primary Entity)
// ============================================================================
// Key: connections:{id}
// Type: Hash
// Structure:
// - id: string (unique identifier: exchange-variant, e.g., "bybit-x03")
// - exchange: string (bybit, bingx, binance, okx, pionex, orangex)
// - name: string (display name)
// - is_enabled: "0"|"1" (Settings toggle - can use for testing/monitoring)
// - is_enabled_dashboard: "0"|"1" (Active Connections dashboard toggle)
// - is_inserted: "0"|"1" (True if real connection vs template)
// - is_predefined: "0"|"1" (True if from base predefinitions)
// - is_live_trade: "0"|"1" (Live trading enabled)
// - is_preset_trade: "0"|"1" (Preset trading enabled)
// - api_key, api_secret, api_passphrase: string (encrypted credentials)
// - created_at, updated_at: ISO timestamps
// Index: connections:all (set of all connection ids)
// Index by exchange: connections:bybit, connections:bingx, etc. (sets)

// ============================================================================
// 2. CONNECTION SETTINGS (Per-Connection Configuration)
// ============================================================================
// Key: settings:connection:{connection_id}
// Type: Hash
// Structure:
// - symbols_source: "main"|"count" (use mainSymbols or retrieve count-based)
// - main_symbols: JSON array (if mainSymbols enabled: ["BTCUSDT", "ETHUSDT", ...])
// - symbols_count: number (if count-based: retrieve top N from exchange)
// - min_profit_factor: number (indication profitability threshold, default 1.5)
// - indication_interval_ms: number (ms between indication updates)
// - strategy_interval_ms: number (ms between strategy evaluation)
// - position_limit: number (max concurrent positions)
// - max_leverage: number (max leverage allowed)

// ============================================================================
// 3. MARKET DATA (Historical & Real-time)
// ============================================================================
// Key: market_data:candles:{connection_id}:{symbol}
// Type: Hash (timestamp => OHLCV json)
// Structure: { "1708200000000": "{\"o\":1000,\"h\":1050,\"l\":990,\"c\":1040,\"v\":1000}" }
// Contains: 30-day historical + real-time data
// Index: market_data:symbols:{connection_id} (set of symbols)

// ============================================================================
// 4. INDICATIONS (Technical Analysis Results)
// ============================================================================
// Key: indications:{connection_id}:{symbol}
// Type: Hash
// Structure:
// - timestamp: ISO timestamp
// - volatility: number (RSI or price movement %)
// - volume_24h: number (24-hour trading volume)
// - activity_ratio: number (current volume / 24h avg)
// - price_change: number (% change in period)
// - profit_factor: number (win/loss ratio from historical)
// - signal: "buy"|"sell"|"hold" (indication signal)
// Historical indications: 30-day range per symbol
// Index: indications:active:{connection_id} (set of symbols with new signals)

// ============================================================================
// 5. STRATEGIES (Trading Rules & Results)
// ============================================================================
// Key: strategy_results:{connection_id}:{symbol}
// Type: Hash
// Structure:
// - strategy_id: string (strategy identifier)
// - timestamp: ISO timestamp
// - signal: "buy"|"sell"|"hold"
// - confidence: number (0-100, likelihood of success)
// - expected_profit: number (% profit expectation)
// - win_rate: number (% of profitable signals historically)
// - max_loss: number (max drawdown risk)
// Index: strategies:active:{connection_id} (set of symbols with signals)

// ============================================================================
// 6. PSEUDO POSITIONS (Pre-entry Analysis)
// ============================================================================
// Key: pseudo_positions:{connection_id}:{symbol}
// Type: Hash
// Structure:
// - entry_price: number
// - quantity: number (based on risk %)
// - entry_time: ISO timestamp
// - strategy_id: string
// - profit_factor: number (from indication)
// - max_profit: number
// - max_loss: number
// Status: "pending" -> "analyzing" -> "ready" -> "filled" or "cancelled"

// ============================================================================
// 7. REAL POSITIONS (Actual Orders/Trades)
// ============================================================================
// Key: positions:{connection_id}:{position_id}
// Type: Hash
// Structure:
// - connection_id: string
// - symbol: string
// - entry_price: number
// - quantity: number
// - entry_time: ISO timestamp
// - direction: "long"|"short"
// - unrealized_pl: number (current P&L)
// - status: "open"|"closed"|"pending"
// Index: positions:open:{connection_id} (set of open position ids)
// Index: positions:closed:{connection_id} (set of closed position ids)

// ============================================================================
// 8. TRADE LOGS (All Execution History)
// ============================================================================
// Key: trade_logs:{connection_id}
// Type: List (JSON entries, most recent first via prepend)
// Structure: [
//   { timestamp, order_id, symbol, side, price, quantity, status, error_msg }
// ]
// Max entries: 1000 per connection

// ============================================================================
// 9. ENGINE PROGRESSION (Real-time Execution Tracking)
// ============================================================================
// Key: engine_progression:{connection_id}
// Type: Hash
// Structure:
// - phase: string (initializing|prehistoric_data|indications|strategies|realtime|live_trading)
// - progress: number (0-100, percentage complete)
// - current_symbol: string (symbol being processed)
// - symbols_total: number (total symbols to process)
// - symbols_current: number (symbols processed so far)
// - sub_phase: string (detailed phase step)
// - message: string (status message)
// - error: string (error message if failed)
// - started_at: ISO timestamp
// - updated_at: ISO timestamp

// ============================================================================
// 10. ENGINE LOGS (Detailed Progression Logs)
// ============================================================================
// Key: engine_logs:{connection_id}
// Type: String (JSON array of log entries)
// Structure: [
//   { timestamp, level, phase, message, details, connectionId }
// ]
// Format (for compact storage): "timestamp|level|phase|message|details_json"
// Max entries: 500 per connection
// Auto-cleanup: 24 hours retention

// ============================================================================
// 11. GLOBAL ENGINE STATE (System-wide Coordinator)
// ============================================================================
// Key: trade_engine:global
// Type: Hash
// Structure:
// - status: "running"|"stopped"|"paused" (global coordinator state)
// - started_at: ISO timestamp
// - heartbeat: ISO timestamp (last activity)
// - auto_started: "true"|"false" (started via pre-startup auto-start)
// - total_active: number (count of active connections)
// Relationships: When status != "running", individual engines can't activate

// ============================================================================
// 12. CONNECTION STATISTICS (Aggregated Metrics)
// ============================================================================
// Key: stats:connection:{connection_id}
// Type: Hash
// Structure:
// - symbols_analyzed: number (total unique symbols processed)
// - indications_generated: number (total indication signals)
// - strategies_evaluated: number (total strategy evaluations)
// - profit_factor_avg: number (average profitability across signals)
// - win_rate: number (% winning signals)
// - total_trades: number (all trades executed)
// - open_positions: number (current open positions)
// - total_pnl: number (cumulative profit/loss)
// - max_drawdown: number (worst peak-to-trough decline)
// - prehistoric_complete: "true"|"false" (30-day historical analysis done)
// - last_update: ISO timestamp

// ============================================================================
// 13. SYSTEM METADATA (Configuration & Status)
// ============================================================================
// Key: settings:system
// Type: Hash
// Structure:
// - schema_version: number (current migrations version)
// - migrations_run: "true" (guard against duplicate migrations)
// - redis_initialized: "true" (system ready)

// ============================================================================
// RELATIONSHIPS & INTEGRITY CONSTRAINTS
// ============================================================================
// 1. connections:{id} -> engine_progression:{id}
//    When connection is active, engine_progression tracks its phases
// 2. connections:{id} -> engine_logs:{id}
//    All execution logs tied to connection by id
// 3. connections:{id} -> market_data:candles:{id}:*
//    Each connection maintains its own market data per symbol
// 4. indications:{id}:{symbol} -> strategy_results:{id}:{symbol}
//    Strategies depend on indication signals
// 5. strategy_results:{id}:{symbol} -> pseudo_positions:{id}:{symbol}
//    Pseudo positions created when strategy signals confidence
// 6. pseudo_positions:{id}:{symbol} -> positions:{id}:*
//    Pseudo positions converted to real positions on execution
// 7. trade_engine:global.status must be "running" for any connection to activate

// ============================================================================
// INDEXES (For efficient lookups)
// ============================================================================
// connections:all (set of all connection ids)
// connections:{exchange} (set of ids per exchange)
// connections:active (set of ids with is_enabled_dashboard=1)
// market_data:symbols:{id} (set of symbols per connection)
// indications:active:{id} (set of symbols with new signals)
// strategies:active:{id} (set of symbols with strategy signals)
// positions:open:{id} (set of open position ids)
// positions:closed:{id} (set of closed position ids)
// _index:{key} (marker for initialized indexes)

// ============================================================================
// ATOMIC OPERATIONS (For Data Consistency)
// ============================================================================
// 1. Add connection to active dashboard:
//    - SET connections:{id} is_enabled_dashboard "1"
//    - SADD connections:active {id}
//    - CHECK trade_engine:global.status == "running"
// 2. Complete progression phase:
//    - HSET engine_progression:{id} phase "{next_phase}" progress "0"
//    - LPUSH engine_logs:{id} "{log_entry}"
// 3. Execute trade (pseudo -> real):
//    - HGET pseudo_positions:{id}:{symbol}
//    - Create positions:{id}:{position_id}
//    - SADD positions:open:{id} {position_id}
//    - LPUSH trade_logs:{id} "{trade_entry}"

// ============================================================================
// DATA MIGRATION PATH (Fresh Deploy)
// ============================================================================
// 1. Initialize schema (migration 001-015)
// 2. Create 11 base connections (migrations set up predefined exchanges)
// 3. Mark 4 as inserted: bybit-x03, bingx-x01, binance-x01, okx-x01
// 4. Mark 2 as dashboard-active: bybit-x03, bingx-x01
// 5. Set global engine status to "running" (pre-startup)
// 6. Ready for connection activation and trading

export const REDIS_SCHEMA = {
  version: 15,
  description: "Complete Redis schema with relationships, indexes, and integrity constraints",
  lastUpdated: new Date().toISOString(),
}
