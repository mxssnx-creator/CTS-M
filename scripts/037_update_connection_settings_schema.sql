-- Add new connection settings fields for Limits and Preset Trade strategy support
-- This migration extends the connection_settings JSONB column structure

-- Add comment documenting the new structure
COMMENT ON COLUMN exchange_connections.connection_settings IS 
'Per-connection trading settings including:
- Volume factors (live/preset)
- Live trade limits (profit factors, drawdown time)
- Preset trade limits (profit factors, drawdown time)
- Preset trade strategy support (block, DCA)
- Trailing configuration
- Adjustment strategies (block, DCA)';

-- Create function to migrate existing settings to new structure
CREATE OR REPLACE FUNCTION migrate_connection_settings_to_limits()
RETURNS void AS $$
BEGIN
  -- Update existing connection_settings to include new fields with defaults
  UPDATE exchange_connections
  SET connection_settings = connection_settings || jsonb_build_object(
    'liveTradeProfitFactorMinBase', COALESCE((connection_settings->>'profitFactorMinBase')::numeric, 0.6),
    'liveTradeProfitFactorMinMain', COALESCE((connection_settings->>'profitFactorMinMain')::numeric, 0.6),
    'liveTradeProfitFactorMinReal', COALESCE((connection_settings->>'profitFactorMinReal')::numeric, 0.6),
    'liveTradeDrawdownTimeHours', 12,
    'presetTradeProfitFactorMinBase', 0.6,
    'presetTradeProfitFactorMinMain', 0.6,
    'presetTradeProfitFactorMinReal', 0.6,
    'presetTradeDrawdownTimeHours', 12,
    'presetTradeBlockEnabled', true,
    'presetTradeDcaEnabled', false
  )
  WHERE connection_settings IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_connection_settings_to_limits();

-- Drop migration function
DROP FUNCTION migrate_connection_settings_to_limits();
