-- Add position_level column to distinguish Base/Main/Real position layers
-- This allows the same pseudo_positions table to handle multiple evaluation stages

ALTER TABLE pseudo_positions 
ADD COLUMN IF NOT EXISTS position_level VARCHAR(20) DEFAULT 'base';

-- Update existing positions to 'base' level
UPDATE pseudo_positions 
SET position_level = 'base' 
WHERE position_level IS NULL;

-- Add index for position level queries
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_level 
ON pseudo_positions(connection_id, symbol, position_level, status);

-- Add profit_factor column for Main Pseudo positions
ALTER TABLE pseudo_positions
ADD COLUMN IF NOT EXISTS profit_factor DECIMAL(10, 4) DEFAULT 0;

-- Add index for profit factor filtering
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_profit_factor
ON pseudo_positions(profit_factor) WHERE position_level = 'main';

COMMENT ON COLUMN pseudo_positions.position_level IS 'Position evaluation stage: base (from indication), main (evaluated from base with PF), or transitioning to real';
COMMENT ON COLUMN pseudo_positions.profit_factor IS 'Profit factor for Main Pseudo positions evaluating from Base';
