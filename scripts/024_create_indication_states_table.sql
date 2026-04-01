-- Create indication_states table for tracking validation timeouts
CREATE TABLE IF NOT EXISTS indication_states (
  id SERIAL PRIMARY KEY,
  state_key VARCHAR(255) UNIQUE NOT NULL,
  validated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indication_states_key ON indication_states(state_key);
CREATE INDEX idx_indication_states_validated ON indication_states(validated_at);

-- Add state_key to pseudo_positions for tracking config sets
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS state_key VARCHAR(255);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS indication_range INTEGER;
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS direction VARCHAR(10);
ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

CREATE INDEX idx_pseudo_positions_state_key ON pseudo_positions(state_key);
CREATE INDEX idx_pseudo_positions_closed ON pseudo_positions(closed_at);
