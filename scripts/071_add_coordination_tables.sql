-- Coordination tables for trade engine performance tracking

-- Trade engine coordination state
CREATE TABLE IF NOT EXISTS trade_engine_coordination (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    symbols_processed INTEGER DEFAULT 0,
    indications_generated INTEGER DEFAULT 0,
    strategies_executed INTEGER DEFAULT 0,
    positions_opened INTEGER DEFAULT 0,
    average_processing_time REAL DEFAULT 0.0,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(connection_id)
);

-- Symbol processing queue
CREATE TABLE IF NOT EXISTS symbol_processing_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    processing_started_at DATETIME,
    processing_completed_at DATETIME,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for coordination tables
CREATE INDEX IF NOT EXISTS idx_coordination_connection 
    ON trade_engine_coordination(connection_id);

CREATE INDEX IF NOT EXISTS idx_coordination_activity 
    ON trade_engine_coordination(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_queue_connection_status 
    ON symbol_processing_queue(connection_id, status);

CREATE INDEX IF NOT EXISTS idx_queue_priority 
    ON symbol_processing_queue(priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_queue_symbol 
    ON symbol_processing_queue(symbol, status);
