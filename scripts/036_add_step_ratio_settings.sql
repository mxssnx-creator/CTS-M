-- Add indication/strategy step ratio settings
-- These control the relationship between indication steps and position steps

INSERT OR IGNORE INTO settings (category, subcategory, key, value, type, description) VALUES
  ('strategy', 'relation', 'indicationPositionStepRatioMin', '0.2', 'number', 'Minimum ratio for position step related to indication step (default: 0.2)'),
  ('strategy', 'relation', 'indicationPositionStepRatioMax', '1.0', 'number', 'Maximum ratio for position step related to indication step (default: 1.0)');

-- Example: If indication step is 10
-- - Minimum position step = 10 * 0.2 = 2
-- - Maximum position step = 10 * 1.0 = 10
-- This ensures position steps are proportional to indication steps
