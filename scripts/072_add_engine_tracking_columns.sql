-- Add engine tracking columns to exchange_connections table
-- Migration: 072 - Add Engine Tracking Columns

-- Add columns for tracking test connection results
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS last_test_message TEXT;

-- Add columns for tracking engine status
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS engine_running INTEGER DEFAULT 0;
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS engine_started_at TIMESTAMP;
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS engine_stopped_at TIMESTAMP;

-- Create index for quick lookups of running engines
CREATE INDEX IF NOT EXISTS idx_exchange_connections_engine_running 
ON exchange_connections(engine_running, is_active);

-- Create index for connection test status
CREATE INDEX IF NOT EXISTS idx_exchange_connections_test_result 
ON exchange_connections(last_test_result, is_active);

-- Update any connections with NULL engine_running to 0
UPDATE exchange_connections SET engine_running = 0 WHERE engine_running IS NULL;
