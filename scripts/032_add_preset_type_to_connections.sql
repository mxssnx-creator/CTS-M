-- Add preset_type_id to exchange_connections table

ALTER TABLE exchange_connections 
ADD COLUMN IF NOT EXISTS preset_type_id VARCHAR(21) REFERENCES preset_types(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_exchange_connections_preset_type ON exchange_connections(preset_type_id);

-- Add comment
COMMENT ON COLUMN exchange_connections.preset_type_id IS 'Assigned preset type for this connection (optional)';
