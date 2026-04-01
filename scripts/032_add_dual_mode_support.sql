-- Add dual-mode support to trade engine state table
ALTER TABLE trade_engine_state
ADD COLUMN IF NOT EXISTS last_preset_run TIMESTAMP,
ADD COLUMN IF NOT EXISTS preset_cycle_duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS preset_symbols_processed INTEGER,
ADD COLUMN IF NOT EXISTS last_main_run TIMESTAMP,
ADD COLUMN IF NOT EXISTS main_cycle_duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS main_symbols_processed INTEGER;

-- Add mode column to indications table
ALTER TABLE indications
ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'main';

-- Add mode column to pseudo_positions table
ALTER TABLE pseudo_positions
ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'main';

-- Add mode column to real_pseudo_positions table
ALTER TABLE real_pseudo_positions
ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'main';

-- Add mode column to trade_logs table
ALTER TABLE trade_logs
ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'main';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_indications_mode ON indications(connection_id, symbol, mode, calculated_at);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_mode ON pseudo_positions(connection_id, symbol, mode, status);
CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_mode ON real_pseudo_positions(connection_id, symbol, mode, status);
CREATE INDEX IF NOT EXISTS idx_trade_logs_mode ON trade_logs(connection_id, symbol, mode, created_at);

-- Add comments
COMMENT ON COLUMN indications.mode IS 'Trading mode: preset (common indicators) or main (step-based)';
COMMENT ON COLUMN pseudo_positions.mode IS 'Trading mode: preset (common indicators) or main (step-based)';
COMMENT ON COLUMN real_pseudo_positions.mode IS 'Trading mode: preset (common indicators) or main (step-based)';
COMMENT ON COLUMN trade_logs.mode IS 'Trading mode: preset (common indicators) or main (step-based)';
