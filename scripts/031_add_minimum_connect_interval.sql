-- Add minimum_connect_interval to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS minimum_connect_interval INTEGER DEFAULT 200;

-- Set default value for existing rows
UPDATE system_settings 
SET minimum_connect_interval = 200 
WHERE minimum_connect_interval IS NULL;

-- Add comment
COMMENT ON COLUMN system_settings.minimum_connect_interval IS 'Minimum interval between API connections in milliseconds (default: 200ms)';
