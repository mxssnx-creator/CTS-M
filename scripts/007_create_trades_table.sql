-- Create trades table to record executed trades
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  exchange_trade_id VARCHAR(100),
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  fee_currency VARCHAR(10),
  is_maker BOOLEAN DEFAULT false,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trades_order ON trades(order_id);
CREATE INDEX idx_trades_executed_at ON trades(executed_at DESC);
