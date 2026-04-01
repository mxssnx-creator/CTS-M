-- Add is_preset_trade column to exchange_connections
ALTER TABLE exchange_connections 
ADD COLUMN IF NOT EXISTS is_preset_trade BOOLEAN DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_exchange_connections_preset_trade 
ON exchange_connections(is_preset_trade) WHERE is_preset_trade = true;

-- Add comment
COMMENT ON COLUMN exchange_connections.is_preset_trade IS 'Whether preset trade is enabled for this connection (independent from live trade)';
