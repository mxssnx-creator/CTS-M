-- Complete Settings Schema with All Settings from Screenshots
-- This ensures NO settings are lost and all are properly categorized

-- Ensure system_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, subcategory, key)
);

-- Insert ALL settings with proper defaults (UPSERT - no overwrite)
INSERT INTO system_settings (category, subcategory, key, value, value_type, description) VALUES

-- Overall / Main Settings (from Screenshot 9)
('overall', 'main', 'baseVolumeFactor', '1.0', 'number', 'Base volume factor (1-10)'),
('overall', 'main', 'positionsAverage', '50', 'number', 'Target average positions'),
('overall', 'main', 'maxLeverage', '125', 'number', 'Maximum leverage systemwide'),
('overall', 'main', 'riskPercentage', '20', 'number', 'Risk percentage'),

-- Overall / Connection Settings (from Screenshot 5)
('overall', 'connection', 'minimumConnectInterval', '200', 'number', 'Minimum connect interval (ms)'),
('overall', 'connection', 'defaultMarginType', 'cross', 'string', 'Default margin type'),
('overall', 'connection', 'defaultPositionMode', 'hedge', 'string', 'Default position mode'),
('overall', 'connection', 'testnetEnabled', 'false', 'boolean', 'Enable testnet by default'),

-- Overall / System Settings (from Screenshot 6)
('overall', 'system', 'autoRestart', 'true', 'boolean', 'Auto-restart on errors'),
('overall', 'system', 'logLevel', 'info', 'string', 'System log level'),
('overall', 'system', 'tradeInterval', '1', 'number', 'Trade engine interval (seconds)'),
('overall', 'system', 'indicationInterval', '1', 'number', 'Indication engine interval (seconds)'),
('overall', 'system', 'strategyInterval', '1', 'number', 'Strategy engine interval (seconds)'),
('overall', 'system', 'maxDatabaseSize', '10240', 'number', 'Maximum database size (MB)'),
('overall', 'system', 'databaseThreshold', '80', 'number', 'Database threshold (%)'),
('overall', 'system', 'autoCleanup', 'true', 'boolean', 'Automatic database cleanup'),
('overall', 'system', 'autoBackup', 'true', 'boolean', 'Automatic database backups'),
('overall', 'system', 'backupInterval', 'daily', 'string', 'Backup interval'),

-- Overall / Monitoring Settings (from Screenshot 8)
('overall', 'monitoring', 'monitoringEnabled', 'true', 'boolean', 'Enable system monitoring'),
('overall', 'monitoring', 'metricsRetention', '30', 'number', 'Metrics retention (days)'),

-- Exchange Settings (from Screenshot 1)
('exchange', null, 'useMainSymbols', 'false', 'boolean', 'Use main symbols'),
('exchange', null, 'symbolsCount', '30', 'number', 'Number of symbols from exchange'),
('exchange', null, 'exchangeBaseVolume', '1.0', 'number', 'Exchange base volume factor'),
('exchange', null, 'minVolumeEnforcement', 'true', 'boolean', 'Enforce minimum volume'),
('exchange', null, 'profitFactorBase', '0.6', 'number', 'Min profit factor - base'),
('exchange', null, 'profitFactorMain', '0.6', 'number', 'Min profit factor - main'),
('exchange', null, 'profitFactorReal', '0.6', 'number', 'Min profit factor - real'),
('exchange', null, 'maxDrawdownTime', '12', 'number', 'Max drawdown time (hours)'),
('exchange', null, 'trailingStopLoss', 'true', 'boolean', 'Trailing stop loss enabled'),
('exchange', null, 'blockAdjustment', 'false', 'boolean', 'Block adjustment enabled'),

-- Indication Settings (from Screenshot 3)
('indication', null, 'indicationTimeInterval', '1', 'number', 'Time interval (seconds)'),
('indication', null, 'indicationMinProfit', '0.7', 'number', 'Minimum profit factor'),
('indication', null, 'indicationRangeMin', '3', 'number', 'Range minimum'),
('indication', null, 'indicationRangeMax', '30', 'number', 'Range maximum'),

-- Strategy Settings (from Screenshot 4)
('strategy', 'base', 'baseValueMin', '0.5', 'number', 'Base value range min'),
('strategy', 'base', 'baseValueMax', '2.5', 'number', 'Base value range max'),
('strategy', 'base', 'baseRatioMin', '0.2', 'number', 'Base ratio min'),
('strategy', 'base', 'baseRatioMax', '1', 'number', 'Base ratio max'),
('strategy', 'base', 'baseTrailing', 'false', 'boolean', 'Base trailing option'),
('strategy', 'main', 'mainPreviousCount', '5', 'number', 'Previous positions count'),
('strategy', 'main', 'mainLastStateCount', 'last3', 'string', 'Last state count'),
('strategy', 'main', 'mainOngoingTrailing', 'true', 'boolean', 'Ongoing positions trailing'),
('strategy', 'main', 'mainBlockAdjustment', 'false', 'boolean', 'Block adjustment'),
('strategy', 'main', 'mainDcaAdjustment', 'false', 'boolean', 'DCA adjustment'),

-- Notification Settings (from Screenshot 7)
('notification', null, 'systemNotifications', 'true', 'boolean', 'System notifications'),
('notification', null, 'telegramNotifications', 'false', 'boolean', 'Telegram notifications')

ON CONFLICT (category, subcategory, key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_lookup ON system_settings(category, subcategory, key);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Settings schema complete - all settings preserved';
END $$;
