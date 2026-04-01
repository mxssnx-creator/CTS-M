-- Create trading pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
  id SERIAL PRIMARY KEY,
  exchange_id INTEGER REFERENCES exchanges(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  base_currency VARCHAR(10) NOT NULL,
  quote_currency VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  min_order_size DECIMAL(20, 8),
  max_order_size DECIMAL(20, 8),
  price_precision INTEGER DEFAULT 8,
  quantity_precision INTEGER DEFAULT 8,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exchange_id, symbol)
);

CREATE INDEX idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX idx_trading_pairs_exchange ON trading_pairs(exchange_id);
