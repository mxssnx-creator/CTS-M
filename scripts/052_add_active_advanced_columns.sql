-- Add active_advanced indication columns to exchange_connections
ALTER TABLE exchange_connections 
  ADD COLUMN IF NOT EXISTS indication_direction BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS indication_move BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS indication_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS indication_active_advanced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS indication_optimal BOOLEAN DEFAULT false;

-- Add active_advanced specific columns to pseudo_positions
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS activity_ratio DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS time_window INTEGER,
  ADD COLUMN IF NOT EXISTS overall_change DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS last_part_change DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS volatility DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS momentum DECIMAL(10, 6),
  ADD COLUMN IF NOT EXISTS drawdown_ratio DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS continuation_ratio DECIMAL(10, 4);

-- Create indexes for active_advanced queries
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_active_advanced 
  ON pseudo_positions(indication_type, activity_ratio, time_window) 
  WHERE indication_type = 'active_advanced';

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_performance 
  ON pseudo_positions(base_position_id, status, created_at);

-- Add system settings for active_advanced
INSERT INTO system_settings (key, value, description) VALUES
  ('activeAdvancedActivityRatiosFrom', '0.5', 'Active Advanced: Activity ratio from (%)'),
  ('activeAdvancedActivityRatiosTo', '3.0', 'Active Advanced: Activity ratio to (%)'),
  ('activeAdvancedActivityRatiosStep', '0.5', 'Active Advanced: Activity ratio step (%)'),
  ('activeAdvancedMinPositions', '3', 'Active Advanced: Minimum data points required'),
  ('activeAdvancedContinuationRatio', '0.6', 'Active Advanced: Minimum continuation ratio'),
  ('activeAdvancedMinVolatility', '0.1', 'Active Advanced: Minimum volatility threshold (%)'),
  ('activeAdvancedMaxDrawdown', '5.0', 'Active Advanced: Maximum drawdown allowed (%)')
ON CONFLICT (key) DO NOTHING;
