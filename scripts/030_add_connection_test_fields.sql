-- Add fields for detailed connection testing
ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS last_test_log JSONB,
ADD COLUMN IF NOT EXISTS last_test_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS api_capabilities JSONB,
ADD COLUMN IF NOT EXISTS rate_limits JSONB,
ADD COLUMN IF NOT EXISTS connection_library VARCHAR(100);

-- Add minimum connect interval to system settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS minimum_connect_interval INTEGER DEFAULT 200;

COMMENT ON COLUMN exchange_connections.last_test_log IS 'Detailed logs from last connection test';
COMMENT ON COLUMN exchange_connections.last_test_timestamp IS 'Timestamp of last connection test';
COMMENT ON COLUMN exchange_connections.api_capabilities IS 'Capabilities retrieved from exchange API';
COMMENT ON COLUMN exchange_connections.rate_limits IS 'Rate limit information from exchange';
COMMENT ON COLUMN system_settings.minimum_connect_interval IS 'Minimum interval between connections in milliseconds';
