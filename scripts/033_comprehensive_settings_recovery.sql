-- Comprehensive Settings Recovery and Synchronization
-- This script ensures ALL settings exist with proper defaults

-- Add any missing columns to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS minimum_connect_interval INTEGER DEFAULT 200;

-- Insert/Update ALL settings with proper categorization
INSERT INTO system_settings (category, subcategory, key, value, value_type, description) VALUES

-- Overall / Main Settings
('overall', 'main', 'tradeMode', 'both', 'string', 'Trade mode: main, preset, or both'),
('overall', 'main', 'marketTimeframe', '1', 'number', 'Market data timeframe in seconds'),
('overall', 'main', 'timeRangeHistoryDays', '5', 'number', 'Days of prehistoric data to load'),
('overall', 'main', 'baseVolumeFactor', '1.0', 'number', 'Base volume factor for position sizing'),
('overall', 'main', 'positionsAverage', '50', 'number', 'Average number of running positions'),
('overall', 'main', 'maxLeverage', '125', 'number', 'Maximum leverage systemwide'),
('overall', 'main', 'riskPercentage', '20', 'number', 'Risk percentage for position sizing'),

-- Overall / Connection Settings
('overall', 'connection', 'minimumConnectInterval', '200', 'number', 'Minimum interval between API connections (ms)'),
('overall', 'connection', 'defaultMarginType', 'cross', 'string', 'Default margin type'),
('overall', 'connection', 'defaultPositionMode', 'hedge', 'string', 'Default position mode'),
('overall', 'connection', 'testnetEnabled', 'false', 'boolean', 'Enable testnet by default'),

-- Overall / Preset Trade Settings
('overall', 'preset', 'presetTpMin', '2', 'number', 'Preset TP factor minimum'),
('overall', 'preset', 'presetTpMax', '30', 'number', 'Preset TP factor maximum'),
('overall', 'preset', 'presetTpStep', '2', 'number', 'Preset TP factor step'),
('overall', 'preset', 'presetSlMin', '0.3', 'number', 'Preset SL ratio minimum'),
('overall', 'preset', 'presetSlMax', '3.0', 'number', 'Preset SL ratio maximum'),
('overall', 'preset', 'presetSlStep', '0.3', 'number', 'Preset SL ratio step'),
('overall', 'preset', 'presetTrailingStart', '[0.5, 1.0, 1.5]', 'json', 'Preset trailing start values'),
('overall', 'preset', 'presetTrailingStop', '[0.2, 0.4, 0.6]', 'json', 'Preset trailing stop values'),

-- Overall / Position Filters
('overall', 'filters', 'realPreviousCountFilter', '5', 'number', 'Previous position count filter'),
('overall', 'filters', 'realLastStateCount', '3', 'number', 'Last state count filter'),
('overall', 'filters', 'realOngoingCount', '10', 'number', 'Ongoing positions count'),

-- Exchange Settings
('exchange', null, 'useMainSymbols', 'false', 'boolean', 'Use predefined main symbols'),
('exchange', null, 'mainSymbols', '["BTC", "ETH", "BNB", "XRP", "ADA"]', 'json', 'Main symbols list'),
('exchange', null, 'symbolsCount', '30', 'number', 'Number of symbols to retrieve'),
('exchange', null, 'baseVolumeFactor', '1.0', 'number', 'Exchange base volume factor'),
('exchange', null, 'minVolumeEnforcement', 'true', 'boolean', 'Enforce minimum volume'),

-- Indication Settings
('indication', null, 'indicatorRsi', 'true', 'boolean', 'Enable RSI indicator'),
('indication', null, 'indicatorMacd', 'true', 'boolean', 'Enable MACD indicator'),
('indication', null, 'indicatorBollinger', 'true', 'boolean', 'Enable Bollinger Bands'),
('indication', null, 'indicatorSar', 'true', 'boolean', 'Enable Parabolic SAR'),
('indication', null, 'indicatorAdx', 'true', 'boolean', 'Enable ADX indicator'),
('indication', null, 'indicationMin', '3', 'number', 'Minimum indication step range'),
('indication', null, 'indicationMax', '30', 'number', 'Maximum indication step range'),
('indication', null, 'indicationStep', '1', 'number', 'Indication step increment'),
('indication', null, 'timeInterval', '1', 'number', 'Indication calculation interval (seconds)'),
('indication', null, 'minProfitFactor', '0.7', 'number', 'Minimum profit factor for indications'),

-- Strategy Settings
('strategy', 'block', 'blockEnabled', 'true', 'boolean', 'Enable block adjust strategy'),
('strategy', 'block', 'blockAdjustmentRatio', '1.0', 'number', 'Block volume adjustment ratio'),
('strategy', 'block', 'blockAutoDisableEnabled', 'true', 'boolean', 'Auto-disable if underperforming'),
('strategy', 'block', 'blockAutoDisableMinBlocks', '2', 'number', 'Min blocks for comparison'),
('strategy', 'block', 'blockAutoDisableComparisonWindow', '50', 'number', 'Comparison window size'),
('strategy', 'dca', 'dcaEnabled', 'true', 'boolean', 'Enable DCA strategy'),
('strategy', 'trailing', 'trailingEnabled', 'true', 'boolean', 'Enable trailing strategy'),
('strategy', null, 'timeInterval', '1', 'number', 'Strategy calculation interval (seconds)'),
('strategy', null, 'minProfitFactor', '0.5', 'number', 'Minimum profit factor for strategies'),

-- System Settings
('system', 'intervals', 'tradeInterval', '1.0', 'number', 'Trade engine interval (seconds)'),
('system', 'intervals', 'realInterval', '0.3', 'number', 'Real positions interval (seconds)'),
('system', 'timing', 'validationTimeout', '15', 'number', 'Validation timeout (seconds)'),
('system', 'timing', 'positionCooldown', '20', 'number', 'Position cooldown (seconds)'),
('system', 'timing', 'maxPositionsPerConfig', '1', 'number', 'Max positions per config'),
('system', 'general', 'autoRestart', 'true', 'boolean', 'Auto-restart on failure'),
('system', 'general', 'logLevel', 'info', 'string', 'System logging level'),
('system', 'general', 'databaseBackup', 'true', 'boolean', 'Enable database backups'),
('system', 'general', 'backupInterval', '24h', 'string', 'Backup interval')

ON CONFLICT (category, subcategory, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_lookup ON system_settings(category, subcategory, key);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
