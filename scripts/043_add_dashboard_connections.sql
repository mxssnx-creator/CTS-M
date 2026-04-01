-- Add field to track which connections are active on dashboard
ALTER TABLE exchange_connections 
ADD COLUMN IF NOT EXISTS is_dashboard_active BOOLEAN DEFAULT false;

-- Set predefined connections (Bybit and BingX) as dashboard active by default
UPDATE exchange_connections 
SET is_dashboard_active = true 
WHERE is_predefined = true 
AND exchange IN ('bybit', 'bingx');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exchange_connections_dashboard_active 
ON exchange_connections(is_dashboard_active);
