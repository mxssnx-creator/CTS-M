-- Create bot_instances table to manage running trading bots
CREATE TABLE IF NOT EXISTS bot_instances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  strategy_id INTEGER REFERENCES strategies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  config JSONB,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_instances_user ON bot_instances(user_id);
CREATE INDEX idx_bot_instances_status ON bot_instances(status);
CREATE INDEX idx_bot_instances_portfolio ON bot_instances(portfolio_id);
