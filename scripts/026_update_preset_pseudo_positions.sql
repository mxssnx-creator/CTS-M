-- Update preset_pseudo_positions table to support common indicators
-- Add columns for indicator data and direction

ALTER TABLE preset_pseudo_positions
ADD COLUMN IF NOT EXISTS direction VARCHAR(10),
ADD COLUMN IF NOT EXISTS strength DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS indicators JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_direction 
ON preset_pseudo_positions(connection_id, preset_id, symbol, direction, status);

-- Add index for indicator queries
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_indicators 
ON preset_pseudo_positions USING GIN(indicators);

COMMENT ON COLUMN preset_pseudo_positions.direction IS 'Trade direction: long or short';
COMMENT ON COLUMN preset_pseudo_positions.strength IS 'Signal strength from combined indicators (0-1)';
COMMENT ON COLUMN preset_pseudo_positions.indicators IS 'JSON array of indicator signals that generated this position';
