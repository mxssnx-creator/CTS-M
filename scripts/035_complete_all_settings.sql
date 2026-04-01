-- Complete Settings Implementation - ALL Missing Settings
-- This adds every hardcoded value found in the audit as a configurable setting

-- Ensure system_settings table exists
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

-- Insert ALL settings (UPSERT - never overwrites existing values)
INSERT INTO system_settings (category, subcategory, key, value, value_type, description) VALUES

-- ========================================
-- OVERALL / MAIN SETTINGS
-- ========================================
('overall', 'main', 'baseVolumeFactor', '1.0', 'number', 'Base volume factor (1-10)'),
('overall', 'main', 'positionsAverage', '50', 'number', 'Target average positions'),
('overall', 'main', 'maxLeverage', '125', 'number', 'Maximum leverage systemwide'),
('overall', 'main', 'riskPercentage', '20', 'number', 'Risk percentage'),
('overall', 'main', 'useMainSymbols', 'false', 'boolean', 'Use main symbols list'),
('overall', 'main', 'forcedSymbols', 'false', 'boolean', 'Force use of main symbols only'),
('overall', 'main', 'mainSymbolsList', '["BTCUSDT","ETHUSDT","BNBUSDT"]', 'json', 'Main symbols list'),

-- ========================================
-- OVERALL / CONNECTION SETTINGS
-- ========================================
('overall', 'connection', 'minimumConnectInterval', '200', 'number', 'Minimum connect interval (ms)'),
('overall', 'connection', 'defaultMarginType', 'cross', 'string', 'Default margin type'),
('overall', 'connection', 'defaultPositionMode', 'hedge', 'string', 'Default position mode'),
('overall', 'connection', 'testnetEnabled', 'false', 'boolean', 'Enable testnet by default'),
('overall', 'connection', 'rateLimitDelay', '100', 'number', 'Rate limit delay (ms)'),
('overall', 'connection', 'maxConcurrentConnections', '10', 'number', 'Max concurrent connections'),

-- ========================================
-- OVERALL / SYSTEM SETTINGS
-- ========================================
('overall', 'system', 'autoRestart', 'true', 'boolean', 'Auto-restart on errors'),
('overall', 'system', 'logLevel', 'info', 'string', 'System log level'),
('overall', 'system', 'tradeInterval', '1.0', 'number', 'Trade engine interval (seconds)'),
('overall', 'system', 'realInterval', '0.3', 'number', 'Real positions interval (seconds)'),
('overall', 'system', 'indicationInterval', '1.0', 'number', 'Indication engine interval (seconds)'),
('overall', 'system', 'strategyInterval', '1.0', 'number', 'Strategy engine interval (seconds)'),
('overall', 'system', 'validationTimeout', '15', 'number', 'Validation timeout (seconds)'),
('overall', 'system', 'positionCooldown', '20', 'number', 'Position cooldown (seconds)'),
('overall', 'system', 'maxPositionsPerConfig', '1', 'number', 'Max positions per config'),
('overall', 'system', 'maxConcurrency', '10', 'number', 'Max concurrent operations'),
('overall', 'system', 'maxDatabaseSize', '10240', 'number', 'Maximum database size (MB)'),
('overall', 'system', 'databaseThreshold', '80', 'number', 'Database threshold (%)'),
('overall', 'system', 'autoCleanup', 'true', 'boolean', 'Automatic database cleanup'),
('overall', 'system', 'autoBackup', 'true', 'boolean', 'Automatic database backups'),
('overall', 'system', 'backupInterval', 'daily', 'string', 'Backup interval'),

-- ========================================
-- OVERALL / MONITORING SETTINGS
-- ========================================
('overall', 'monitoring', 'monitoringEnabled', 'true', 'boolean', 'Enable system monitoring'),
('overall', 'monitoring', 'metricsRetention', '30', 'number', 'Metrics retention (days)'),

-- ========================================
-- EXCHANGE SETTINGS
-- ========================================
('exchange', 'symbols', 'symbolsCount', '30', 'number', 'Number of symbols from exchange'),
('exchange', 'symbols', 'exchangeBaseVolume', '1.0', 'number', 'Exchange base volume factor'),
('exchange', 'symbols', 'minVolumeEnforcement', 'true', 'boolean', 'Enforce minimum volume'),
('exchange', 'strategies', 'profitFactorBase', '0.6', 'number', 'Min profit factor - base'),
('exchange', 'strategies', 'profitFactorMain', '0.6', 'number', 'Min profit factor - main'),
('exchange', 'strategies', 'profitFactorReal', '0.6', 'number', 'Min profit factor - real'),
('exchange', 'strategies', 'maxDrawdownTime', '12', 'number', 'Max drawdown time (hours)'),
('exchange', 'strategies', 'trailingStopLoss', 'true', 'boolean', 'Trailing stop loss enabled'),
('exchange', 'strategies', 'blockAdjustment', 'false', 'boolean', 'Block adjustment enabled'),

-- ========================================
-- PRESET TRADE ENGINE SETTINGS
-- ========================================
('preset', 'engine', 'batchSize', '10', 'number', 'Preset batch size'),
('preset', 'engine', 'maxConcurrent', '5', 'number', 'Max concurrent presets'),
('preset', 'engine', 'maxPositions', '250', 'number', 'Max preset positions'),
('preset', 'engine', 'positionTimeout', '2', 'number', 'Position timeout (hours)'),
('preset', 'ranges', 'tpMin', '2', 'number', 'Take profit min'),
('preset', 'ranges', 'tpMax', '30', 'number', 'Take profit max'),
('preset', 'ranges', 'tpStep', '2', 'number', 'Take profit step'),
('preset', 'ranges', 'slMin', '0.3', 'number', 'Stop loss min'),
('preset', 'ranges', 'slMax', '3.0', 'number', 'Stop loss max'),
('preset', 'ranges', 'slStep', '0.3', 'number', 'Stop loss step'),
('preset', 'trailing', 'starts', '[0.5,1.0,1.5]', 'json', 'Trailing start values'),
('preset', 'trailing', 'stops', '[0.2,0.4,0.6]', 'json', 'Trailing stop values'),

-- ========================================
-- INDICATION SETTINGS
-- ========================================
('indication', 'timing', 'timeInterval', '1', 'number', 'Time interval (seconds)'),
('indication', 'timing', 'minProfitFactor', '0.7', 'number', 'Minimum profit factor'),
('indication', 'ranges', 'rangeMin', '3', 'number', 'Range minimum'),
('indication', 'ranges', 'rangeMax', '30', 'number', 'Range maximum'),
('indication', 'ranges', 'rangeStep', '1', 'number', 'Range step'),
('indication', 'calculation', 'tpRangeDivisor', '3', 'number', 'TP range divisor'),
('indication', 'calculation', 'maxActivePositions', '100', 'number', 'Max active positions'),

-- ========================================
-- COMMON INDICATORS SETTINGS
-- ========================================
('indicators', 'rsi', 'period', '14', 'number', 'RSI period'),
('indicators', 'rsi', 'oversold', '30', 'number', 'RSI oversold level'),
('indicators', 'rsi', 'overbought', '70', 'number', 'RSI overbought level'),
('indicators', 'macd', 'fastPeriod', '12', 'number', 'MACD fast period'),
('indicators', 'macd', 'slowPeriod', '26', 'number', 'MACD slow period'),
('indicators', 'macd', 'signalPeriod', '9', 'number', 'MACD signal period'),
('indicators', 'bollinger', 'period', '20', 'number', 'Bollinger period'),
('indicators', 'bollinger', 'stdDev', '2', 'number', 'Bollinger std deviation'),
('indicators', 'sar', 'acceleration', '0.02', 'number', 'SAR acceleration'),
('indicators', 'sar', 'maximum', '0.2', 'number', 'SAR maximum'),
('indicators', 'adx', 'period', '14', 'number', 'ADX period'),

-- ========================================
-- STRATEGY SETTINGS
-- ========================================
('strategy', 'base', 'valueMin', '0.5', 'number', 'Base value range min'),
('strategy', 'base', 'valueMax', '2.5', 'number', 'Base value range max'),
('strategy', 'base', 'ratioMin', '0.2', 'number', 'Base ratio min'),
('strategy', 'base', 'ratioMax', '1', 'number', 'Base ratio max'),
('strategy', 'base', 'trailing', 'false', 'boolean', 'Base trailing option'),
('strategy', 'base', 'minProfitFactor', '0.4', 'number', 'Base min profit factor'),
('strategy', 'main', 'previousCount', '5', 'number', 'Previous positions count'),
('strategy', 'main', 'lastStateCount', 'last3', 'string', 'Last state count'),
('strategy', 'main', 'ongoingTrailing', 'true', 'boolean', 'Ongoing positions trailing'),
('strategy', 'main', 'blockAdjustment', 'false', 'boolean', 'Block adjustment'),
('strategy', 'main', 'dcaAdjustment', 'false', 'boolean', 'DCA adjustment'),
('strategy', 'block', 'adjustmentRatio', '1.0', 'number', 'Block adjustment ratio'),
('strategy', 'block', 'autoDisable', 'true', 'boolean', 'Block auto disable'),
('strategy', 'block', 'comparisonWindow', '50', 'number', 'Block comparison window'),
('strategy', 'block', 'minBlocks', '2', 'number', 'Min blocks for auto disable'),
('strategy', 'block', 'sizes', '[2,4,6,8]', 'json', 'Block sizes'),
('strategy', 'dca', 'levels', '[3,5]', 'json', 'DCA levels'),
('strategy', 'limits', 'maxStrategies', '150', 'number', 'Max strategies'),

-- ========================================
-- RISK MANAGEMENT SETTINGS
-- ========================================
('risk', 'limits', 'maxDrawdownPercent', '20', 'number', 'Max drawdown percent'),
('risk', 'limits', 'maxOpenPositions', '100', 'number', 'Max open positions'),
('risk', 'limits', 'portfolioRiskPercent', '2', 'number', 'Portfolio risk percent'),
('risk', 'trading', 'defaultLeverage', '150', 'number', 'Default leverage'),
('risk', 'trading', 'closeFeePercent', '0.1', 'number', 'Close fee percent'),
('risk', 'trading', 'trailingStopDistance', '2', 'number', 'Trailing stop distance (%)'),

-- ========================================
-- MARKET DATA SETTINGS
-- ========================================
('market', 'data', 'updateInterval', '60000', 'number', 'Market data update interval (ms)'),
('market', 'mock', 'basePrice', '50000', 'number', 'Mock base price'),
('market', 'mock', 'volatility', '1000', 'number', 'Mock volatility'),

-- ========================================
-- BACKTEST SETTINGS
-- ========================================
('backtest', 'config', 'lookbackPeriod', '10', 'number', 'Lookback period (candles)'),
('backtest', 'config', 'defaultSymbols', '["BTCUSDT","ETHUSDT","XRPUSDT"]', 'json', 'Default symbols'),

-- ========================================
-- ANALYTICS SETTINGS
-- ========================================
('analytics', 'windows', 'last50Window', '50', 'number', 'Last 50 positions window'),
('analytics', 'windows', 'timeRangeHours', '24', 'number', 'Time range (hours)'),

-- ========================================
-- NOTIFICATION SETTINGS
-- ========================================
('notification', 'system', 'enabled', 'true', 'boolean', 'System notifications'),
('notification', 'telegram', 'enabled', 'false', 'boolean', 'Telegram notifications'),
('notification', 'telegram', 'token', '', 'string', 'Telegram bot token'),
('notification', 'telegram', 'chatId', '', 'string', 'Telegram chat ID')

ON CONFLICT (category, subcategory, key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_subcategory ON system_settings(subcategory);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_lookup ON system_settings(category, subcategory, key);

-- Log completion
DO $$
DECLARE
  setting_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO setting_count FROM system_settings;
  RAISE NOTICE 'Complete settings implementation finished - % total settings', setting_count;
END $$;
