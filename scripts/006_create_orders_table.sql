-- Create orders table to track all trading orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  trading_pair_id INTEGER REFERENCES trading_pairs(id) ON DELETE CASCADE,
  exchange_order_id VARCHAR(100),
  order_type VARCHAR(20) CHECK (order_type IN ('market', 'limit', 'stop_loss', 'take_profit', 'stop_limit')),
  side VARCHAR(10) CHECK (side IN ('buy', 'sell')),
  price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  remaining_quantity DECIMAL(20, 8),
  average_fill_price DECIMAL(20, 8),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected', 'expired')),
  time_in_force VARCHAR(10) DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK')),
  fees DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_portfolio ON orders(portfolio_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_trading_pair ON orders(trading_pair_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
