-- Fix exchange_connections table to add missing columns
-- This resolves the "column exchange does not exist" error when adding connections

-- Add the exchange column if it doesn't exist
ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS exchange VARCHAR(50);

-- Sync exchange column with exchange_id for existing records
UPDATE exchange_connections ec
SET exchange = e.name
FROM exchanges e
WHERE ec.exchange_id = e.id AND ec.exchange IS NULL;

-- Add other missing columns that are referenced in the API code
ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS connection_library VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_capabilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{"requests_per_second": 10, "requests_per_minute": 600}'::jsonb,
ADD COLUMN IF NOT EXISTS connection_priority JSONB DEFAULT '["rest", "library", "typescript", "websocket"]'::jsonb,
ADD COLUMN IF NOT EXISTS use_main_symbols BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS arrangement_type VARCHAR(50) DEFAULT 'market_cap',
ADD COLUMN IF NOT EXISTS arrangement_count INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS last_test_log TEXT[];

-- Update connection_method CHECK constraint to include all methods
ALTER TABLE exchange_connections DROP CONSTRAINT IF EXISTS exchange_connections_connection_method_check;
ALTER TABLE exchange_connections ADD CONSTRAINT exchange_connections_connection_method_check 
  CHECK (connection_method IN ('rest', 'websocket', 'library', 'typescript'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_predefined ON exchange_connections(is_predefined) WHERE is_predefined = true;
CREATE INDEX IF NOT EXISTS idx_exchange_connections_active ON exchange_connections(is_active) WHERE is_active = true;

-- Ensure all connections have volume configuration
INSERT INTO volume_configuration (connection_id, base_volume_factor)
SELECT id, 1.0 FROM exchange_connections
WHERE id NOT IN (SELECT connection_id FROM volume_configuration)
ON CONFLICT (connection_id) DO NOTHING;

-- Ensure all connections have trade engine state
INSERT INTO trade_engine_state (connection_id, status)
SELECT id, 'stopped' FROM exchange_connections
WHERE id NOT IN (SELECT connection_id FROM trade_engine_state)
ON CONFLICT (connection_id) DO NOTHING;
