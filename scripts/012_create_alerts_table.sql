-- Create alerts table for price alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  trading_pair_id INTEGER REFERENCES trading_pairs(id) ON DELETE CASCADE,
  alert_type VARCHAR(20) CHECK (alert_type IN ('price_above', 'price_below', 'volume_spike', 'position_pnl')),
  condition_value DECIMAL(20, 8),
  message TEXT,
  is_triggered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);
