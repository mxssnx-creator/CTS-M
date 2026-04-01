-- Add predefined Bybit and BingX connections
-- These will be created automatically on first load

-- Create predefined connections for Bybit and BingX
INSERT INTO exchange_connections (
  id, user_id, name, exchange_id, exchange, api_type, connection_method,
  api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, is_predefined
)
SELECT 
  'predefined-bybit',
  1,
  'Bybit (Predefined)',
  e.id,
  'bybit',
  'unified',
  'rest',
  '',
  '',
  'cross',
  'hedge',
  true,
  false,
  true
FROM exchanges e WHERE e.name = 'bybit'
ON CONFLICT (id) DO NOTHING;

INSERT INTO exchange_connections (
  id, user_id, name, exchange_id, exchange, api_type, connection_method,
  api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, is_predefined
)
SELECT 
  'predefined-bingx',
  1,
  'BingX (Predefined)',
  e.id,
  'bingx',
  'perpetual_futures',
  'rest',
  '',
  '',
  'cross',
  'hedge',
  true,
  false,
  true
FROM exchanges e WHERE e.name = 'bingx'
ON CONFLICT (id) DO NOTHING;

-- Add is_predefined column if it doesn't exist
ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN DEFAULT false;

-- Initialize volume configuration for predefined connections
INSERT INTO volume_configuration (connection_id, base_volume_factor)
VALUES 
  ('predefined-bybit', 1.0),
  ('predefined-bingx', 1.0)
ON CONFLICT (connection_id) DO NOTHING;

-- Initialize trade engine state for predefined connections
INSERT INTO trade_engine_state (connection_id, status)
VALUES 
  ('predefined-bybit', 'stopped'),
  ('predefined-bingx', 'stopped')
ON CONFLICT (connection_id) DO NOTHING;
