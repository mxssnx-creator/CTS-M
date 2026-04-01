-- Create risk_limits table for risk management
CREATE TABLE IF NOT EXISTS risk_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  max_position_size DECIMAL(20, 8),
  max_daily_loss DECIMAL(20, 8),
  max_drawdown_percent DECIMAL(5, 2),
  max_leverage DECIMAL(5, 2) DEFAULT 1.0,
  max_open_positions INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_limits_user ON risk_limits(user_id);
CREATE INDEX idx_risk_limits_portfolio ON risk_limits(portfolio_id);
