-- Migration 052: Add Active Advanced indication type support
-- Adds columns for advanced activity tracking with multiple time windows

-- Add Active Advanced columns to pseudo_positions table
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS activity_ratio NUMERIC(5,2);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS time_window INTEGER;
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS overall_change NUMERIC(10,4);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS last_part_change NUMERIC(10,4);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS volatility NUMERIC(10,4);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS momentum NUMERIC(10,4);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS continuation_ratio NUMERIC(5,4);

-- Add Active Advanced columns to base_pseudo_positions table  
ALTER TABLE base_pseudo_positions ADD COLUMN IF NOT EXISTS activity_ratio NUMERIC(5,2);
ALTER TABLE base_pseudo_positions ADD COLUMN IF NOT EXISTS time_window INTEGER;

-- Create indexes for Active Advanced queries
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_active_advanced 
  ON pseudo_positions(connection_id, symbol, indication_type, activity_ratio, time_window) 
  WHERE indication_type = 'active_advanced';

CREATE INDEX IF NOT EXISTS idx_base_pseudo_active_advanced 
  ON base_pseudo_positions(connection_id, symbol, indication_type, activity_ratio, time_window) 
  WHERE indication_type = 'active_advanced';

-- Add comments
COMMENT ON COLUMN pseudo_positions.activity_ratio IS 'Activity percentage threshold (0.5-3.0%)';
COMMENT ON COLUMN pseudo_positions.time_window IS 'Time window in minutes (1-40)';
COMMENT ON COLUMN pseudo_positions.overall_change IS 'Overall price change in time window';
COMMENT ON COLUMN pseudo_positions.last_part_change IS 'Price change in last 20% of window';
COMMENT ON COLUMN pseudo_positions.volatility IS 'Price volatility percentage';
COMMENT ON COLUMN pseudo_positions.momentum IS 'Price momentum (% per second)';
COMMENT ON COLUMN pseudo_positions.continuation_ratio IS 'Last part vs overall change ratio';
