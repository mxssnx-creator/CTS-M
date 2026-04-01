-- Create volume_configuration table for volume and risk management
CREATE TABLE IF NOT EXISTS volume_configuration (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  base_volume_factor DECIMAL(5, 2) DEFAULT 1.0 CHECK (base_volume_factor >= 1.0 AND base_volume_factor <= 10.0),
  max_leverage DECIMAL(5, 2) DEFAULT 125.0,
  positions_average INTEGER DEFAULT 50,
  risk_percentage DECIMAL(5, 2) DEFAULT 20.0,
  enforce_min_volume BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id)
);

CREATE INDEX idx_volume_configuration_connection ON volume_configuration(connection_id);

-- Create position_volume_calculations table for tracking volume calculations
CREATE TABLE IF NOT EXISTS position_volume_calculations (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES exchange_connections(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  base_volume_factor DECIMAL(5, 2) NOT NULL,
  leverage DECIMAL(5, 2) NOT NULL,
  calculated_volume DECIMAL(20, 8) NOT NULL,
  exchange_min_volume DECIMAL(20, 8),
  final_volume DECIMAL(20, 8) NOT NULL,
  volume_adjusted BOOLEAN DEFAULT false,
  adjustment_reason VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_position_volume_calculations_connection ON position_volume_calculations(connection_id);
CREATE INDEX idx_position_volume_calculations_symbol ON position_volume_calculations(symbol);
CREATE INDEX idx_position_volume_calculations_created_at ON position_volume_calculations(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_volume_configuration_updated_at BEFORE UPDATE ON volume_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
