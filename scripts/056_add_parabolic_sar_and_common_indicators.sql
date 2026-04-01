-- Migration 056: Add Parabolic SAR and Common Indicators Support
-- Enhances the system with common trading indicators

-- Add ParabolicSAR indicator settings
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('parabolicSarEnabled', 'true', 'Enable Parabolic SAR indicator', 'indications_common'),
  ('parabolicSarAccelerationFactor', '0.02', 'Parabolic SAR acceleration factor (default: 0.02)', 'indications_common'),
  ('parabolicSarMaxFactor', '0.2', 'Parabolic SAR maximum factor (default: 0.2)', 'indications_common'),
  ('rsiEnabled', 'true', 'Enable RSI indicator', 'indications_common'),
  ('rsiPeriod', '14', 'RSI calculation period', 'indications_common'),
  ('rsiOversold', '30', 'RSI oversold threshold', 'indications_common'),
  ('rsiOverbought', '70', 'RSI overbought threshold', 'indications_common'),
  ('macdEnabled', 'true', 'Enable MACD indicator', 'indications_common'),
  ('macdFastPeriod', '12', 'MACD fast period', 'indications_common'),
  ('macdSlowPeriod', '26', 'MACD slow period', 'indications_common'),
  ('macdSignalPeriod', '9', 'MACD signal period', 'indications_common'),
  ('bollingerEnabled', 'true', 'Enable Bollinger Bands indicator', 'indications_common'),
  ('bollingerPeriod', '20', 'Bollinger Bands period', 'indications_common'),
  ('bollingerStdDev', '2', 'Bollinger Bands standard deviation multiplier', 'indications_common'),
  ('adxEnabled', 'true', 'Enable ADX indicator', 'indications_common'),
  ('adxPeriod', '14', 'ADX calculation period', 'indications_common'),
  ('adxStrongThreshold', '25', 'ADX strong trend threshold', 'indications_common'),
  ('stochasticEnabled', 'true', 'Enable Stochastic Oscillator', 'indications_common'),
  ('stochasticPeriod', '14', 'Stochastic calculation period', 'indications_common')
ON CONFLICT (key) DO NOTHING;

-- Add ParabolicSAR columns to indication_states if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'indication_states' 
    AND column_name = 'parabolic_sar_value'
  ) THEN
    ALTER TABLE indication_states ADD COLUMN parabolic_sar_value DECIMAL(20, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'indication_states' 
    AND column_name = 'parabolic_sar_trend'
  ) THEN
    ALTER TABLE indication_states ADD COLUMN parabolic_sar_trend TEXT;
  END IF;
  
  -- Add common indicators tracking to preset_pseudo_positions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'preset_pseudo_positions' 
    AND column_name = 'common_indicators_used'
  ) THEN
    ALTER TABLE preset_pseudo_positions ADD COLUMN common_indicators_used JSONB DEFAULT '[]';
  END IF;
  
  -- Add indicator signals snapshot
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'preset_pseudo_positions' 
    AND column_name = 'indicator_signals'
  ) THEN
    ALTER TABLE preset_pseudo_positions ADD COLUMN indicator_signals JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create index for common indicator queries
CREATE INDEX IF NOT EXISTS idx_indication_states_sar ON indication_states(parabolic_sar_trend);
CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_indicators ON preset_pseudo_positions USING GIN (common_indicators_used);
