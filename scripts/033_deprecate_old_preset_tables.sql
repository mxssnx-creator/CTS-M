-- Deprecate old preset testing and active configuration tables
-- These are replaced by the new preset coordination system with preset_types, preset_type_sets, and preset_real_trades

-- Note: We're not dropping these tables immediately to allow for data migration if needed
-- They can be safely dropped after confirming the new system is working correctly

-- Add deprecation comments
COMMENT ON TABLE preset_test_results IS 'DEPRECATED: Replaced by preset coordination system. Use preset_type_sets and configuration_sets instead.';
COMMENT ON TABLE preset_active_configs IS 'DEPRECATED: Replaced by preset coordination system. Use preset_type_sets with is_active flag instead.';
COMMENT ON TABLE preset_trades IS 'DEPRECATED: Replaced by preset_real_trades table in the new coordination system.';

-- Create a view to help transition from old to new system
CREATE OR REPLACE VIEW preset_migration_helper AS
SELECT 
  pac.id as old_config_id,
  pac.preset_id as old_preset_id,
  pac.connection_id,
  pac.symbol,
  pac.indicator_type,
  pac.takeprofit_factor,
  pac.stoploss_ratio,
  pac.trailing_enabled,
  pac.trail_start,
  pac.trail_stop,
  pac.profit_factor,
  pac.win_rate,
  pac.is_active,
  'Use preset_type_sets with configuration_sets for new system' as migration_note
FROM preset_active_configs pac
WHERE pac.is_active = true;

COMMENT ON VIEW preset_migration_helper IS 'Helper view to identify active configurations that need migration to the new preset coordination system';

-- Log deprecation
DO $$
BEGIN
  RAISE NOTICE 'Old preset tables (preset_test_results, preset_active_configs, preset_trades) have been marked as deprecated.';
  RAISE NOTICE 'New system uses: preset_types, preset_type_sets, configuration_sets, preset_real_trades';
  RAISE NOTICE 'These tables will be dropped in a future migration after data migration is confirmed.';
END $$;
