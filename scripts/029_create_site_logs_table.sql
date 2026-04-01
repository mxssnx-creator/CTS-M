-- Create site_logs table for detailed site logging
CREATE TABLE IF NOT EXISTS site_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  level VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  details TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level);
CREATE INDEX IF NOT EXISTS idx_site_logs_resolved ON site_logs(resolved);
