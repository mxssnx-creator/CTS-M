-- Rename is_dashboard_active to is_active for better semantics
-- "Active Connections" can be defined in different parts of the project

-- Rename the column
ALTER TABLE exchange_connections 
RENAME COLUMN is_dashboard_active TO is_active;

-- Drop old index
DROP INDEX IF EXISTS idx_exchange_connections_dashboard_active;

-- Create new index with updated name
CREATE INDEX IF NOT EXISTS idx_exchange_connections_active 
ON exchange_connections(is_active) WHERE is_active = true;

-- Ensure predefined connections (Bybit and BingX) are active by default
UPDATE exchange_connections 
SET is_active = true 
WHERE is_predefined = true 
AND exchange IN ('bybit', 'bingx');
