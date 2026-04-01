-- Fix exchange_connections schema to support all features
-- This script ensures the table has all necessary columns

-- Add missing columns to exchange_connections table
ALTER TABLE exchange_connections
ADD COLUMN IF NOT EXISTS exchange VARCHAR(50),
ADD COLUMN IF NOT EXISTS connection_library VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_predefined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_dashboard_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_capabilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{"requests_per_second": 10, "requests_per_minute": 600}'::jsonb,
ADD COLUMN IF NOT EXISTS connection_priority JSONB DEFAULT '["rest", "library", "typescript", "websocket"]'::jsonb,
ADD COLUMN IF NOT EXISTS use_main_symbols BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS arrangement_type VARCHAR(50) DEFAULT 'market_cap',
ADD COLUMN IF NOT EXISTS arrangement_count INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS last_test_log TEXT[];

-- Change id column from SERIAL to TEXT to support string IDs
-- First, drop the existing primary key constraint
ALTER TABLE exchange_connections DROP CONSTRAINT IF EXISTS exchange_connections_pkey;

-- Change id column type to TEXT
ALTER TABLE exchange_connections ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Re-add primary key constraint
ALTER TABLE exchange_connections ADD PRIMARY KEY (id);

-- Update the unique constraint to use TEXT id
ALTER TABLE exchange_connections DROP CONSTRAINT IF EXISTS exchange_connections_user_id_name_key;
ALTER TABLE exchange_connections ADD CONSTRAINT exchange_connections_user_id_name_key UNIQUE (user_id, name);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_predefined ON exchange_connections(is_predefined) WHERE is_predefined = true;
CREATE INDEX IF NOT EXISTS idx_exchange_connections_dashboard_active ON exchange_connections(is_dashboard_active) WHERE is_dashboard_active = true;

-- Now insert predefined connections with proper string IDs
INSERT INTO exchange_connections (
  id, user_id, name, exchange_id, exchange, api_type, connection_method,
  api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, 
  is_predefined, is_dashboard_active, connection_library,
  api_capabilities, rate_limits, connection_priority
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
  true,
  true,
  'pybit',
  '["unified", "perpetual_futures", "spot", "leverage", "hedge_mode", "trailing"]'::jsonb,
  '{"requests_per_second": 10, "requests_per_minute": 120}'::jsonb,
  '["rest", "library", "typescript", "websocket"]'::jsonb
FROM exchanges e WHERE e.name = 'bybit'
ON CONFLICT (id) DO UPDATE SET
  is_predefined = true,
  is_dashboard_active = true,
  exchange = 'bybit',
  connection_library = 'pybit',
  api_capabilities = '["unified", "perpetual_futures", "spot", "leverage", "hedge_mode", "trailing"]'::jsonb,
  rate_limits = '{"requests_per_second": 10, "requests_per_minute": 120}'::jsonb;

INSERT INTO exchange_connections (
  id, user_id, name, exchange_id, exchange, api_type, connection_method,
  api_key, api_secret, margin_type, position_mode, is_testnet, is_enabled, 
  is_predefined, is_dashboard_active, connection_library,
  api_capabilities, rate_limits, connection_priority
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
  true,
  true,
  'bingx-trading-api',
  '["futures", "perpetual_futures", "leverage", "hedge_mode"]'::jsonb,
  '{"requests_per_second": 5, "requests_per_minute": 300}'::jsonb,
  '["rest", "library", "typescript", "websocket"]'::jsonb
FROM exchanges e WHERE e.name = 'bingx'
ON CONFLICT (id) DO UPDATE SET
  is_predefined = true,
  is_dashboard_active = true,
  exchange = 'bingx',
  connection_library = 'bingx-trading-api',
  api_capabilities = '["futures", "perpetual_futures", "leverage", "hedge_mode"]'::jsonb,
  rate_limits = '{"requests_per_second": 5, "requests_per_minute": 300}'::jsonb;

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

-- Update foreign key constraints in related tables to support TEXT ids
-- volume_configuration
ALTER TABLE volume_configuration DROP CONSTRAINT IF EXISTS volume_configuration_connection_id_fkey;
ALTER TABLE volume_configuration ALTER COLUMN connection_id TYPE TEXT USING connection_id::TEXT;
ALTER TABLE volume_configuration ADD CONSTRAINT volume_configuration_connection_id_fkey 
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE;

-- trade_engine_state
ALTER TABLE trade_engine_state DROP CONSTRAINT IF EXISTS trade_engine_state_connection_id_fkey;
ALTER TABLE trade_engine_state ALTER COLUMN connection_id TYPE TEXT USING connection_id::TEXT;
ALTER TABLE trade_engine_state ADD CONSTRAINT trade_engine_state_connection_id_fkey 
  FOREIGN KEY (connection_id) REFERENCES exchange_connections(id) ON DELETE CASCADE;
