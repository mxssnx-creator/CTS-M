-- Comprehensive fix for exchange connections
-- This script ensures all tables and relationships are correct

-- Step 1: Ensure exchanges table has all exchanges
INSERT INTO exchanges (name, display_name, supports_spot, supports_futures, api_endpoint, websocket_endpoint) 
VALUES 
  ('bybit', 'Bybit', true, true, 'https://api.bybit.com', 'wss://stream.bybit.com'),
  ('bingx', 'BingX', true, true, 'https://open-api.bingx.com', 'wss://open-api-swap.bingx.com'),
  ('pionex', 'Pionex', true, true, 'https://api.pionex.com', 'wss://ws.pionex.com'),
  ('orangex', 'OrangeX', true, true, 'https://api.orangex.com', 'wss://ws.orangex.com'),
  ('okx', 'OKX', true, true, 'https://www.okx.com', 'wss://ws.okx.com:8443'),
  ('binance', 'Binance', true, true, 'https://api.binance.com', 'wss://stream.binance.com:9443')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = true;

-- Step 2: Add all missing columns to exchange_connections
ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS exchange VARCHAR(50),
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

-- Step 3: Update connection_method CHECK constraint to include all methods
ALTER TABLE exchange_connections DROP CONSTRAINT IF EXISTS exchange_connections_connection_method_check;
ALTER TABLE exchange_connections ADD CONSTRAINT exchange_connections_connection_method_check 
  CHECK (connection_method IN ('rest', 'websocket', 'library', 'typescript'));

-- Step 4: Sync exchange column with exchange_id
UPDATE exchange_connections ec
SET exchange = e.name
FROM exchanges e
WHERE ec.exchange_id = e.id AND ec.exchange IS NULL;

-- Step 5: Create predefined connections (using integer IDs from SERIAL)
-- First, get the exchange IDs
DO $$
DECLARE
  bybit_exchange_id INTEGER;
  bingx_exchange_id INTEGER;
BEGIN
  -- Get exchange IDs
  SELECT id INTO bybit_exchange_id FROM exchanges WHERE name = 'bybit';
  SELECT id INTO bingx_exchange_id FROM exchanges WHERE name = 'bingx';

  -- Insert Bybit predefined connection
  INSERT INTO exchange_connections (
    user_id, name, exchange_id, exchange, api_type, connection_method,
    api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, 
    is_predefined, is_active, connection_library,
    api_capabilities, rate_limits, connection_priority
  )
  VALUES (
    1,
    'Bybit (Predefined)',
    bybit_exchange_id,
    'bybit',
    'unified',
    'rest',
    '',
    '',
    'cross',
    'hedge',
    true,
    false,
    true,
    true,
    'pybit',
    '["unified", "perpetual_futures", "spot", "leverage", "hedge_mode", "trailing"]'::jsonb,
    '{"requests_per_second": 10, "requests_per_minute": 120}'::jsonb,
    '["rest", "library", "typescript", "websocket"]'::jsonb
  )
  ON CONFLICT (user_id, name) DO UPDATE SET
    is_predefined = true,
    is_active = true,
    exchange = 'bybit',
    connection_library = 'pybit';

  -- Insert BingX predefined connection
  INSERT INTO exchange_connections (
    user_id, name, exchange_id, exchange, api_type, connection_method,
    api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, 
    is_predefined, is_active, connection_library,
    api_capabilities, rate_limits, connection_priority
  )
  VALUES (
    1,
    'BingX (Predefined)',
    bingx_exchange_id,
    'bingx',
    'perpetual_futures',
    'rest',
    '',
    '',
    'cross',
    'hedge',
    true,
    false,
    true,
    true,
    'bingx-trading-api',
    '["futures", "perpetual_futures", "leverage", "hedge_mode"]'::jsonb,
    '{"requests_per_second": 5, "requests_per_minute": 300}'::jsonb,
    '["rest", "library", "typescript", "websocket"]'::jsonb
  )
  ON CONFLICT (user_id, name) DO UPDATE SET
    is_predefined = true,
    is_active = true,
    exchange = 'bingx',
    connection_library = 'bingx-trading-api';
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_predefined ON exchange_connections(is_predefined) WHERE is_predefined = true;
CREATE INDEX IF NOT EXISTS idx_exchange_connections_active ON exchange_connections(is_active) WHERE is_active = true;

-- Step 7: Initialize volume configuration for all connections
INSERT INTO volume_configuration (connection_id, base_volume_factor)
SELECT id, 1.0 FROM exchange_connections
WHERE id NOT IN (SELECT connection_id FROM volume_configuration)
ON CONFLICT (connection_id) DO NOTHING;

-- Step 8: Initialize trade engine state for all connections
INSERT INTO trade_engine_state (connection_id, status)
SELECT id, 'stopped' FROM exchange_connections
WHERE id NOT IN (SELECT connection_id FROM trade_engine_state)
ON CONFLICT (connection_id) DO NOTHING;
