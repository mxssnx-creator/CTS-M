-- Add connection_settings JSON column to exchange_connections table
ALTER TABLE exchange_connections 
ADD COLUMN IF NOT EXISTS connection_settings JSONB DEFAULT '{}'::jsonb;

-- Add index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_exchange_connections_settings 
ON exchange_connections USING gin(connection_settings);

-- Add comment
COMMENT ON COLUMN exchange_connections.connection_settings IS 'Per-connection trading settings (volume factors, profit factors, trailing, adjust types)';
