-- Create performance_metrics table for tracking portfolio performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,
  daily_pnl DECIMAL(20, 8) DEFAULT 0,
  daily_return_percent DECIMAL(10, 4) DEFAULT 0,
  cumulative_return_percent DECIMAL(10, 4) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown_percent DECIMAL(10, 4),
  win_rate DECIMAL(5, 2),
  total_trades INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(portfolio_id, date)
);

CREATE INDEX idx_performance_metrics_portfolio ON performance_metrics(portfolio_id);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(date DESC);
