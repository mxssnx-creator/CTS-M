-- Fix exchange_connections table to use VARCHAR for id instead of SERIAL
-- This allows using nanoid strings as primary keys

-- Step 1: Create a new table with the correct schema
CREATE TABLE IF NOT EXISTS exchange_connections_new (
  id VARCHAR(21) PRIMARY KEY, -- nanoid generates 21-character strings
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  exchange_id INTEGER REFERENCES exchanges(id) ON DELETE CASCADE,
  exchange VARCHAR(50), -- Exchange name for quick reference
  api_type VARCHAR(50) NOT NULL,
  connection_method VARCHAR(20) CHECK (connection_method IN ('rest', 'websocket', 'library', 'typescript')),
  connection_library VARCHAR(100), -- Library package name
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  api_passphrase TEXT,
  margin_type VARCHAR(20) DEFAULT 'cross' CHECK (margin_type IN ('cross', 'isolated')),
  position_mode VARCHAR(20) DEFAULT 'hedge' CHECK (position_mode IN ('hedge', 'one_way', 'one-way')),
  is_testnet BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT false,
  is_live_trade BOOLEAN DEFAULT false,
  is_predefined BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  api_capabilities JSONB DEFAULT '[]'::jsonb,
  rate_limits JSONB DEFAULT '{}'::jsonb,
  connection_priority INTEGER DEFAULT 1,
  last_test_at TIMESTAMP,
  last_test_status VARCHAR(20),
  last_test_balance DECIMAL(20, 8),
  last_test_error TEXT,
  last_test_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Step 2: Migrate existing data if any (convert integer IDs to strings)
INSERT INTO exchange_connections_new (
  id, user_id, name, exchange_id, exchange, api_type, connection_method, 
  connection_library, api_key, api_secret, api_passphrase, margin_type, 
  position_mode, is_testnet, is_enabled, is_live_trade, is_predefined, 
  is_active, last_test_at, last_test_status, last_test_balance, 
  last_test_error, created_at, updated_at
)
SELECT 
  'legacy_' || id::text, -- Convert old integer IDs to strings with prefix
  user_id, name, exchange_id, 
  COALESCE(exchange, (SELECT name FROM exchanges WHERE id = exchange_id LIMIT 1)),
  api_type, connection_method,
  COALESCE(connection_library, library_package, 'rest'),
  api_key, api_secret, api_passphrase, margin_type,
  position_mode, is_testnet, is_enabled, is_live_trade,
  COALESCE(is_predefined, false),
  COALESCE(is_active, true),
  last_test_at, last_test_status, last_test_balance,
  last_test_error, created_at, updated_at
FROM exchange_connections
ON CONFLICT (user_id, name) DO NOTHING;

-- Step 3: Update foreign key references in related tables
-- Update volume_configuration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volume_configuration') THEN
    -- Add new column for string IDs
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'volume_configuration' AND column_name = 'connection_id_new'
    ) THEN
      ALTER TABLE volume_configuration ADD COLUMN connection_id_new VARCHAR(21);
    END IF;
    
    -- Migrate data
    UPDATE volume_configuration vc
    SET connection_id_new = 'legacy_' || vc.connection_id::text
    WHERE connection_id_new IS NULL;
    
    -- Drop old column and rename new one
    ALTER TABLE volume_configuration DROP COLUMN IF EXISTS connection_id CASCADE;
    ALTER TABLE volume_configuration RENAME COLUMN connection_id_new TO connection_id;
    
    -- Add foreign key constraint
    ALTER TABLE volume_configuration 
      ADD CONSTRAINT fk_volume_configuration_connection 
      FOREIGN KEY (connection_id) REFERENCES exchange_connections_new(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update trade_engine_state
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_engine_state') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trade_engine_state' AND column_name = 'connection_id_new'
    ) THEN
      ALTER TABLE trade_engine_state ADD COLUMN connection_id_new VARCHAR(21);
    END IF;
    
    UPDATE trade_engine_state tes
    SET connection_id_new = 'legacy_' || tes.connection_id::text
    WHERE connection_id_new IS NULL;
    
    ALTER TABLE trade_engine_state DROP COLUMN IF EXISTS connection_id CASCADE;
    ALTER TABLE trade_engine_state RENAME COLUMN connection_id_new TO connection_id;
    
    ALTER TABLE trade_engine_state 
      ADD CONSTRAINT fk_trade_engine_state_connection 
      FOREIGN KEY (connection_id) REFERENCES exchange_connections_new(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Drop old table and rename new one
DROP TABLE IF EXISTS exchange_connections CASCADE;
ALTER TABLE exchange_connections_new RENAME TO exchange_connections;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_exchange_connections_user ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_enabled ON exchange_connections(is_enabled);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_predefined ON exchange_connections(is_predefined);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_active ON exchange_connections(is_active);

-- Step 6: Recreate trigger
DROP TRIGGER IF EXISTS update_exchange_connections_updated_at ON exchange_connections;
CREATE TRIGGER update_exchange_connections_updated_at 
  BEFORE UPDATE ON exchange_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 048: Fixed exchange_connections ID type from INTEGER to VARCHAR(21) for nanoid support';
END $$;
