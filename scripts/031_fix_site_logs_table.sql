-- Drop and recreate site_logs table with correct schema for SystemLogger
DROP TABLE IF EXISTS site_logs CASCADE;

CREATE TABLE site_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  user_id INTEGER,
  connection_id TEXT,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_site_logs_level ON site_logs(level);
CREATE INDEX idx_site_logs_category ON site_logs(category);
CREATE INDEX idx_site_logs_timestamp ON site_logs(timestamp DESC);
CREATE INDEX idx_site_logs_connection_id ON site_logs(connection_id);
CREATE INDEX idx_site_logs_user_id ON site_logs(user_id);
