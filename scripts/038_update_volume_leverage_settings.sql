-- Update volume and leverage settings schema
-- Add new settings for Base Volume, Leverage, and Overall sections

-- Add Base Volume settings
INSERT INTO system_settings (category, subcategory, key, value, value_type, description)
VALUES 
  ('overall', 'main', 'baseVolumeFactor', '1.0', 'number', 'Base volume factor for position sizing'),
  ('overall', 'main', 'riskPercentage', '20', 'number', 'Range percentage for risk calculation'),
  ('overall', 'main', 'targetAveragePositions', '50', 'number', 'Target count for volume factor calculation')
ON CONFLICT (category, subcategory, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Add Leverage settings
INSERT INTO system_settings (category, subcategory, key, value, value_type, description)
VALUES 
  ('overall', 'main', 'useMaximalLeverage', 'true', 'boolean', 'Use maximal leverage available'),
  ('overall', 'main', 'leveragePercentage', '100', 'number', 'Leverage percentage (1-100, step 5)')
ON CONFLICT (category, subcategory, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Add Overall section settings
INSERT INTO system_settings (category, subcategory, key, value, value_type, description)
VALUES 
  ('overall', 'main', 'positionCost', '0.1', 'number', 'Position cost factor (0.01-0.2)')
ON CONFLICT (category, subcategory, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Remove old maximum leverage setting (keep for backward compatibility but mark as deprecated)
UPDATE system_settings 
SET description = 'DEPRECATED: Use leveragePercentage instead'
WHERE key = 'maxLeverage';
