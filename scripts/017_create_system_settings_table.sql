-- Create system_settings table for application-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'overall', 'exchange', 'indication', 'strategy', 'notification'
  subcategory VARCHAR(50), -- 'main', 'connection', 'system', 'monitoring', 'install'
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, subcategory, key)
);

CREATE INDEX idx_system_settings_category ON system_settings(category, subcategory);

-- Insert default system settings
INSERT INTO system_settings (category, subcategory, key, value, value_type, description) VALUES
-- Overall / Main
('overall', 'main', 'base_volume_factor', '1.0', 'number', 'Base volume factor (1-10) for position sizing'),
('overall', 'main', 'positions_average', '50', 'number', 'Average number of running positions'),
('overall', 'main', 'max_leverage', '125', 'number', 'Maximum leverage to use systemwide'),
('overall', 'main', 'risk_percentage', '20', 'number', 'Market movement % that triggers loss at base volume factor 1'),

-- Overall / Connection
('overall', 'connection', 'default_margin_type', 'cross', 'string', 'Default margin type for new connections'),
('overall', 'connection', 'default_position_mode', 'hedge', 'string', 'Default position mode for new connections'),
('overall', 'connection', 'testnet_enabled', 'false', 'boolean', 'Enable testnet by default'),

-- Overall / System
('overall', 'system', 'auto_restart', 'true', 'boolean', 'Automatically restart trade engine on failure'),
('overall', 'system', 'log_level', 'info', 'string', 'System logging level'),
('overall', 'system', 'database_backup', 'true', 'boolean', 'Enable automatic database backups'),
('overall', 'system', 'backup_interval', '24h', 'string', 'Database backup interval'),

-- Overall / Monitoring
('overall', 'monitoring', 'enable_monitoring', 'true', 'boolean', 'Enable system monitoring'),
('overall', 'monitoring', 'metrics_retention_days', '30', 'number', 'Days to retain monitoring metrics'),

-- Exchange
('exchange', null, 'use_main_symbols', 'false', 'boolean', 'Use predefined main symbols instead of retrieving from exchange'),
('exchange', null, 'main_symbols', '["BTC", "ETH", "BNB", "XRP", "ADA"]', 'json', 'Main symbols to trade when use_main_symbols is enabled'),
('exchange', null, 'symbols_count', '30', 'number', 'Number of symbols to retrieve from exchange'),
('exchange', null, 'base_volume_factor', '1.0', 'number', 'Exchange-specific base volume factor'),
('exchange', null, 'min_volume_enforcement', 'true', 'boolean', 'Enforce exchange minimum volume requirements'),

-- Indication
('indication', null, 'time_interval', '1', 'number', 'Time interval for indication calculations (seconds)'),
('indication', null, 'range_min', '3', 'number', 'Minimum indication range'),
('indication', null, 'range_max', '30', 'number', 'Maximum indication range'),
('indication', null, 'min_profit_factor', '0.7', 'number', 'Minimum profit factor for indications'),

-- Strategy
('strategy', null, 'time_interval', '1', 'number', 'Time interval for strategy calculations (seconds)'),
('strategy', null, 'min_profit_factor', '0.5', 'number', 'Minimum profit factor for strategies'),
('strategy', null, 'trailing_enabled', 'true', 'boolean', 'Enable trailing stop loss'),
('strategy', null, 'dca_enabled', 'true', 'boolean', 'Enable dollar cost averaging'),

-- Notification
('notification', null, 'enable_notifications', 'true', 'boolean', 'Enable system notifications'),
('notification', null, 'enable_telegram', 'false', 'boolean', 'Enable Telegram notifications'),
('notification', null, 'telegram_token', '', 'string', 'Telegram bot token'),
('notification', null, 'telegram_chat_id', '', 'string', 'Telegram chat ID')
ON CONFLICT (category, subcategory, key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
