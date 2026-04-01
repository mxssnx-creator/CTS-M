-- Migration 054: Rename active_advanced to auto throughout the database
-- This comprehensive migration updates all references from active_advanced to auto

-- Step 1: Update indication_type enum values in pseudo_positions
UPDATE pseudo_positions 
SET indication_type = 'auto' 
WHERE indication_type = 'active_advanced';

-- Step 2: Update indication_type in base_pseudo_positions
UPDATE base_pseudo_positions 
SET indication_type = 'auto' 
WHERE indication_type = 'active_advanced';

-- Step 3: Update indication_type in real_pseudo_positions (if exists)
UPDATE real_pseudo_positions 
SET indication_type = 'auto' 
WHERE indication_type = 'active_advanced';

-- Step 4: Update indication_states table
UPDATE indication_states 
SET state_key = REPLACE(state_key, 'active_advanced', 'auto')
WHERE state_key LIKE '%active_advanced%';

-- Step 5: Update system_settings keys
UPDATE system_settings 
SET key = REPLACE(key, 'activeAdvanced', 'auto'),
    description = REPLACE(description, 'Active Advanced', 'Auto')
WHERE key LIKE '%activeAdvanced%';

-- Step 6: Update connection indication column names
ALTER TABLE exchange_connections 
RENAME COLUMN indication_active_advanced TO indication_auto;

-- Step 7: Add new Auto-specific columns to pseudo_positions
ALTER TABLE pseudo_positions
ADD COLUMN IF NOT EXISTS eight_hour_trend VARCHAR(20), -- 'bullish', 'bearish', 'neutral'
ADD COLUMN IF NOT EXISTS market_direction_short VARCHAR(20), -- 'up', 'down', 'sideways' (5-20min)
ADD COLUMN IF NOT EXISTS market_direction_long VARCHAR(20), -- 'up', 'down', 'sideways' (1-4hour)
ADD COLUMN IF NOT EXISTS progressive_activity DECIMAL(10, 4), -- Increasing change detection
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(20), -- 'base', 'block', 'level', 'dca'
ADD COLUMN IF NOT EXISTS block_neutral_count INTEGER DEFAULT 0, -- Wait positions (1-3)
ADD COLUMN IF NOT EXISTS level_volume_ratio DECIMAL(10, 4), -- Optimal volume increment
ADD COLUMN IF NOT EXISTS dca_step INTEGER DEFAULT 1, -- Current DCA step
ADD COLUMN IF NOT EXISTS dca_total_steps INTEGER DEFAULT 4; -- Total DCA steps

-- Step 8: Add comprehensive Auto strategy settings
INSERT INTO system_settings (key, value, description) VALUES
-- 8-hour analysis settings
('autoUse8HourAnalysis', 'true', 'Auto: Enable 8-hour historical market analysis'),
('auto8HourTrendWeight', '0.3', 'Auto: Weight of 8-hour trend in decision (0-1)'),

-- Progressive analysis settings
('autoProgressiveThreshold', '0.15', 'Auto: Minimum increasing change threshold (%)'),
('autoProgressiveSteps', '3', 'Auto: Number of progressive steps to confirm'),

-- Market direction settings
('autoShortDirectionWindow', '15', 'Auto: Short-term direction window (5-20 minutes)'),
('autoLongDirectionWindow', '120', 'Auto: Long-term direction window (1-4 hours)'),
('autoDirectionConfirmation', '0.7', 'Auto: Direction confirmation threshold (0-1)'),

-- Trailing optimal ranges
('autoTrailingWithEnabled', 'true', 'Auto: Enable positions WITH trailing'),
('autoTrailingWithoutEnabled', 'true', 'Auto: Enable positions WITHOUT trailing'),
('autoTrailingOptimalMin', '0.3', 'Auto: Minimum trailing range'),
('autoTrailingOptimalMax', '1.5', 'Auto: Maximum trailing range'),
('autoTrailingOptimalStep', '0.3', 'Auto: Trailing range step'),

-- Position increment strategies
('autoIncrementAfterSituation', 'true', 'Auto: Enable position increment after optimal situation'),
('autoIncrementThreshold', '0.8', 'Auto: Threshold for position increment (profit factor)'),

-- Block strategy with neutral wait
('autoBlockEnabled', 'true', 'Auto: Enable block strategy'),
('autoBlockSize', '4', 'Auto: Block size (2, 4, 6, 8)'),
('autoBlockNeutralWait', '3', 'Auto: Neutral wait positions (1-3) when adjusted loose'),
('autoBlockVolumeKeepOnLoose', 'false', 'Auto: Keep volume increased on adjusted loose'),
('autoBlockAdjustmentRatio', '1.5', 'Auto: Block volume adjustment ratio'),

-- Level strategy (optimal volume increment)
('autoLevelEnabled', 'true', 'Auto: Enable Level strategy (optimal volume increment)'),
('autoLevelMinRatio', '1.1', 'Auto: Level minimum volume increment ratio'),
('autoLevelMaxRatio', '2.3', 'Auto: Level maximum volume increment ratio'),
('autoLevelStepRatio', '0.2', 'Auto: Level volume increment step'),
('autoLevelProfitFactorThreshold', '0.7', 'Auto: Level activation profit factor'),

-- DCA strategy (up to 4 steps)
('autoDcaEnabled', 'true', 'Auto: Enable DCA strategy'),
('autoDcaMaxSteps', '4', 'Auto: Maximum DCA steps (1-4)'),
('autoDcaStep1Ratio', '1.3', 'Auto: DCA step 1 volume ratio'),
('autoDcaStep2Ratio', '1.6', 'Auto: DCA step 2 volume ratio'),
('autoDcaStep3Ratio', '2.0', 'Auto: DCA step 3 volume ratio'),
('autoDcaStep4Ratio', '2.4', 'Auto: DCA step 4 volume ratio (max 2.5)'),
('autoDcaTriggerThreshold', '-0.5', 'Auto: DCA trigger threshold (% loss)'),
('autoDcaSpacing', '0.3', 'Auto: DCA spacing between steps (%)'),

-- Profit back to positive tactics
('autoProfitBackEnabled', 'true', 'Auto: Enable profit back to positive tactics'),
('autoProfitBackThreshold', '-2.0', 'Auto: Drawdown threshold to trigger tactics (%)'),
('autoProfitBackVolumeIncrease', '1.8', 'Auto: Volume increase for recovery positions'),
('autoProfitBackPartialClose', '0.5', 'Auto: Partial close ratio when back to positive'),

-- Combined metrics optimization
('autoCombineStrategies', 'true', 'Auto: Combine multiple strategies for optimal results'),
('autoMetricsWeight', '{"profit_factor": 0.4, "win_rate": 0.3, "drawdown": 0.3}', 'Auto: Metrics weight distribution')

ON CONFLICT (key) DO NOTHING;

-- Step 9: Update indexes (drop old, create new)
DROP INDEX IF EXISTS idx_pseudo_positions_active_advanced;
DROP INDEX IF EXISTS idx_base_pseudo_active_advanced;

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_auto
ON pseudo_positions(connection_id, symbol, indication_type, created_at)
WHERE indication_type = 'auto';

CREATE INDEX IF NOT EXISTS idx_base_pseudo_auto
ON base_pseudo_positions(connection_id, symbol, indication_type, status)
WHERE indication_type = 'auto';

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_auto_strategy
ON pseudo_positions(connection_id, symbol, strategy_type, status)
WHERE indication_type = 'auto';

-- Step 10: Add comment for documentation
COMMENT ON COLUMN pseudo_positions.indication_type IS 'Indication type: direction, move, active, optimal, or auto (renamed from active_advanced)';
COMMENT ON COLUMN pseudo_positions.strategy_type IS 'Strategy type for Auto indication: base, block, level, or dca';
COMMENT ON COLUMN pseudo_positions.block_neutral_count IS 'Block strategy: number of neutral wait positions when adjusted loose';
COMMENT ON COLUMN pseudo_positions.level_volume_ratio IS 'Level strategy: optimal volume increment ratio based on performance';
COMMENT ON COLUMN pseudo_positions.dca_step IS 'DCA strategy: current step (1-4) in dollar cost averaging';
