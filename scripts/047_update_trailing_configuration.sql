-- Update trailing configuration to add master enable/disable toggle
-- Remove ongoing positions trailing setting (nonsense - trailing is controlled at base level)

-- Add trailing enabled setting (default: true)
INSERT INTO system_settings (category, subcategory, key, value, value_type, description)
VALUES ('strategy', 'trailing', 'trailingEnabled', 'true', 'boolean', 'Master toggle for trailing strategy - affects all strategies from base away')
ON CONFLICT (category, subcategory, key) DO UPDATE SET
  description = EXCLUDED.description;

-- Remove ongoing positions trailing setting (it's nonsense)
DELETE FROM system_settings 
WHERE key IN ('mainOngoingTrailing', 'ongoingTrailing', 'ongoingPositionsTrailing');

-- Add comment explaining the change
COMMENT ON COLUMN system_settings.key IS 'Setting key - trailing is now controlled globally via trailingEnabled, not per-strategy';
