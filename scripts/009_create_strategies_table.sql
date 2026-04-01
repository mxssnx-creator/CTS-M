-- Create strategies table for trading bot strategies
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  strategy_type VARCHAR(50) CHECK (strategy_type IN ('trend_following', 'mean_reversion', 'arbitrage', 'market_making', 'custom')),
  parameters JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strategies_user ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(strategy_type);
