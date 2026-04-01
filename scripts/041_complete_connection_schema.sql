-- Complete Exchange Connections Schema
-- Add missing fields for comprehensive connection management

ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS api_capabilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{"requests_per_second": 10, "requests_per_minute": 600}'::jsonb,
ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS connection_priority JSONB DEFAULT '["rest", "library", "typescript", "websocket"]'::jsonb,
ADD COLUMN IF NOT EXISTS use_main_symbols BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS arrangement_type VARCHAR(50) DEFAULT 'market_cap',
ADD COLUMN IF NOT EXISTS arrangement_count INTEGER DEFAULT 20;

-- Update existing predefined connections with proper capabilities
UPDATE exchange_connections
SET 
  api_capabilities = '["unified", "perpetual_futures", "spot", "leverage", "hedge_mode", "trailing"]'::jsonb,
  rate_limits = '{"requests_per_second": 10, "requests_per_minute": 120}'::jsonb,
  connection_priority = '["rest", "library", "typescript", "websocket"]'::jsonb
WHERE exchange = 'bybit' AND is_predefined = true;

UPDATE exchange_connections
SET 
  api_capabilities = '["futures", "perpetual_futures", "leverage", "hedge_mode"]'::jsonb,
  rate_limits = '{"requests_per_second": 5, "requests_per_minute": 300}'::jsonb,
  connection_priority = '["rest", "library", "typescript", "websocket"]'::jsonb
WHERE exchange = 'bingx' AND is_predefined = true;

UPDATE exchange_connections
SET 
  api_capabilities = '["futures", "perpetual_futures", "leverage", "hedge_mode"]'::jsonb,
  rate_limits = '{"requests_per_second": 10, "requests_per_minute": 600}'::jsonb,
  connection_priority = '["rest", "library", "typescript", "websocket"]'::jsonb
WHERE exchange = 'pionex' AND is_predefined = true;

UPDATE exchange_connections
SET 
  api_capabilities = '["futures", "perpetual_futures", "leverage"]'::jsonb,
  rate_limits = '{"requests_per_second": 10, "requests_per_minute": 600}'::jsonb,
  connection_priority = '["rest", "library", "typescript", "websocket"]'::jsonb
WHERE exchange = 'orangex' AND is_predefined = true;

-- Create index for faster connection lookups
CREATE INDEX IF NOT EXISTS idx_exchange_connections_enabled ON exchange_connections(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_exchange_connections_predefined ON exchange_connections(is_predefined) WHERE is_predefined = true;
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
