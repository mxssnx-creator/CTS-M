-- Migration 038: Fix pseudo_positions schema
-- Adds missing columns for optimal indication type support
-- These columns are required for linking positions to base configurations
-- and tracking the optimal indication parameters

-- Add base_position_id to link to base_pseudo_positions
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS base_position_id TEXT;

-- Add optimal configuration parameters
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS drawdown_ratio REAL;
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS market_change_range INTEGER;
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS last_part_ratio REAL;

-- Create index for base_position_id lookups
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position 
ON pseudo_positions(base_position_id);

-- Create composite index for optimal configuration lookups
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_optimal_config 
ON pseudo_positions(
  symbol, indication_type, drawdown_ratio, market_change_range, last_part_ratio
) WHERE indication_type = 'optimal';
