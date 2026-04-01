-- Add type column to pseudo_positions table to support Base, Main, Real, and Active types
ALTER TABLE pseudo_positions 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'base' CHECK (type IN ('base', 'main', 'real', 'active'));

-- Create index for type column for better query performance
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_type ON pseudo_positions(type);

-- Update existing positions to have proper types (default to 'base' if not set)
UPDATE pseudo_positions SET type = 'base' WHERE type IS NULL;

-- Add comment to explain the type column
COMMENT ON COLUMN pseudo_positions.type IS 'Position type: base (initial), main (validated), real (pre-live), active (exchange live positions)';
