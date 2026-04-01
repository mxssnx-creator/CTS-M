-- Add ALL missing settings found in code comments and database schema
-- This ensures every "editable in settings" comment is actually editable

-- Adding all settings mentioned in code as "editable in settings"
INSERT INTO system_settings (category, subcategory, key, value, type, description)
VALUES
  -- Overall > Main > Symbols Configuration
  ('overall', 'main', 'useMainSymbols', 'false', 'boolean', 'Use predefined main symbols instead of exchange symbols'),
  ('overall', 'main', 'mainSymbols', '["BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","ADAUSDT"]', 'json', 'Main symbols list (JSON array)'),
  ('overall', 'main', 'forcedSymbols', '[]', 'json', 'Forced symbols that must always be included (JSON array)'),
  ('overall', 'main', 'symbolsCount', '30', 'number', 'Number of symbols to retrieve from exchange'),
  
  -- Overall > Main > Trade Mode & Timeframes
  ('overall', 'main', 'tradeMode', 'both', 'string', 'Trade mode: main, preset, or both'),
  ('overall', 'main', 'marketDataTimeframe', '1.0', 'number', 'Market data timeframe in seconds'),
  ('overall', 'main', 'timeRangeHistoryDays', '5', 'number', 'Days of prehistoric data to load (1-12)'),
  
  -- Overall > Main > Position Management
  ('overall', 'main', 'validationCooldown', '10000', 'number', 'Validation cooldown in milliseconds'),
  ('overall', 'main', 'positionTimeout', '15000', 'number', 'Position timeout in milliseconds'),
  ('overall', 'main', 'maxActivePerConfig', '1', 'number', 'Maximum active positions per configuration'),
  ('overall', 'main', 'positionCooldownTimeout', '20', 'number', 'Position cooldown timeout in seconds'),
  
  -- Overall > Connection > Intervals
  ('overall', 'connection', 'minimumConnectInterval', '200', 'number', 'Minimum connect interval in milliseconds'),
  
  -- Preset > Engine Configuration
  ('preset', 'engine', 'positionTimeoutHours', '2', 'number', 'Preset position timeout in hours'),
  ('preset', 'engine', 'maxConcurrentPositions', '250', 'number', 'Maximum concurrent preset positions'),
  ('preset', 'engine', 'batchSize', '10', 'number', 'Batch size for preset processing'),
  ('preset', 'engine', 'maxConcurrent', '5', 'number', 'Maximum concurrent preset operations'),
  ('preset', 'engine', 'rateLimitDelay', '100', 'number', 'Rate limit delay in milliseconds'),
  
  -- System > Prehistoric Data
  ('system', 'prehistoric', 'prehistoricDataLoaded', 'false', 'boolean', 'Whether prehistoric data has been loaded'),
  ('system', 'prehistoric', 'prehistoricDataDays', '30', 'number', 'Days of prehistoric data to load'),
  ('system', 'prehistoric', 'prehistoricDataStart', '', 'string', 'Prehistoric data start timestamp'),
  ('system', 'prehistoric', 'prehistoricDataEnd', '', 'string', 'Prehistoric data end timestamp')
ON CONFLICT (category, subcategory, key) 
DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description;
