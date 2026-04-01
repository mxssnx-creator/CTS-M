-- Update system settings for new symbol system
-- Symbols now use base names only (BTC, ETH) without quote currency
-- System automatically appends quote currency based on API type

-- Add new settings for symbol arrangement
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing symbol settings to use base names only
UPDATE system_settings 
SET value = '["BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOT", "MATIC", "AVAX", "LINK"]'
WHERE key = 'mainSymbols';

UPDATE system_settings 
SET value = '["XRP", "BCH"]'
WHERE key = 'forcedSymbols';

-- Add new settings for symbol arrangement
INSERT INTO system_settings (category, subcategory, key, value, value_type, description) VALUES
('exchange', null, 'useMainSymbols', 'false', 'boolean', 'Use predefined main symbols instead of dynamic arrangement'),
('exchange', null, 'arrangementType', 'marketCap24h', 'string', 'Symbol arrangement type: marketCap24h, marketVolume, marketVolatility, priceChange24h'),
('exchange', null, 'arrangementCount', '30', 'number', 'Number of symbols to select from arrangement'),
('exchange', null, 'quoteAsset', 'USDT', 'string', 'Quote asset to append to base symbols (USDT, BUSD, USD, etc)')
ON CONFLICT (category, subcategory, key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Add arrangement type options table
CREATE TABLE IF NOT EXISTS symbol_arrangement_types (
  id SERIAL PRIMARY KEY,
  type_key VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO symbol_arrangement_types (type_key, display_name, description) VALUES
('marketCap24h', 'Market Cap (24h)', 'Sort symbols by 24-hour market capitalization'),
('marketVolume', 'Market Volume', 'Sort symbols by trading volume'),
('marketVolatility', 'Market Volatility', 'Sort symbols by price volatility'),
('priceChange24h', 'Price Change (24h)', 'Sort symbols by 24-hour price change percentage'),
('liquidityScore', 'Liquidity Score', 'Sort symbols by liquidity and order book depth')
ON CONFLICT (type_key) DO NOTHING;
