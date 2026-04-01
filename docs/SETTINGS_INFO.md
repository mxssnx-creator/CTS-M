# CTS v3.1 - Settings System Overview

## Quick Reference

### Settings Organization

The Settings system is divided into **5 main tabs**, each with focused responsibilities:

#### 1. **Overall Tab** - Core Trading Parameters
- Main: Data, volume, position, leverage configuration
- Connection: Default connection settings and API parameters
- Monitoring: System monitoring and auto-restart policies
- Install: Database initialization tools
- Backup: Database backup and restore

#### 2. **Exchange Tab** - Exchange-Specific Configuration
- Connection selection (which exchange to use)
- Trade volume factors (Main and Preset)
- Symbol selection (order type, count, quote asset)
- Position cost synchronization
- Main/Preset strategy settings (Direction, Move, Active, Optimal, Trailing, Block, DCA)

**NOTE**: Exchange tab contains STRATEGY SETTINGS, not Preset configurations. Use Settings > Strategy tab for Preset trade configuration.

#### 3. **Indication Tab** - Indication Settings
- Main: Direction, Move, Active indications with intervals/timeouts
- Optimal: Optimal coordination configuration
- Common: RSI, MACD, Bollinger Bands indicators
- Auto: Auto-indication engine settings

#### 4. **Strategy Tab** - Trading Strategies
- Base: Base value/ratio ranges and trailing option
- Main: Previous positions and state counts
- Trailing: Start/stop values configuration
- Adjustment: Block and DCA strategy toggles
- Real: Real strategy settings (when created)
- Preset: Preset trade configuration (separated from Exchange tab)

#### 5. **System Tab** - System Configuration
- Active Engines: Main and Preset engine toggles
- Trade Mode: both/main/preset selection
- Processing Intervals: Engine update frequencies
- Position Management: Cooldowns and concurrency limits
- Database Size: Configuration set database limits
- Database Management: Cleanup, backups, maintenance

---

## Key Architecture Points

### Separation of Concerns
- **Overall**: Global trading parameters
- **Exchange**: Exchange connection and live trading configuration
- **Strategy**: Trading strategy definitions and presets
- **Indication**: Market analysis and signal generation
- **System**: Engine and database management

### Main Strategy Volume Calculation
- Uses **ONLY RATIO-BASED** calculations
- NO dependency on Exchange balance
- Position cost (0.1%) used for volume ratio calculations only
- Independent from account balance or exchange data

### Exchange Positions
- Mirror actual executed trades from exchange
- Volume captured at execution time (not recalculated)
- Used for statistics, comparisons, and performance tracking
- No live API polling needed (cached data used)

### Trailing Strategy
- Classified as **Additional** (base logistics)
- Applied to Base positions automatically when enabled
- Works with ANY configuration combination
- Independent from Adjust strategies (Block, DCA)

---

## Save Button & Toast Messages

The Save button displays appropriate toast notifications for:
- ✅ **Settings Saved**: Normal save successful
- ⏸️ **Engine Paused**: When database size changes detected
- 🔄 **Database Reorganizing**: When size thresholds adjusted
- ▶️ **Engines Resuming**: After database operation complete
- ❌ **Error Messages**: Any validation or save failures

---

## Common Tasks

### Change Trading Mode
Settings > System Tab > Trade Mode: select "both", "main", or "preset"

### Enable/Disable Indications
Settings > Indication Tab > Main > Toggle Direction/Move/Active/Optimal

### Add Preset Configurations
Settings > Strategy Tab > Preset > Add/Edit Preset Trade Configuration

### Adjust Position Costs
Settings > Overall > Main > Position Cost Percentage (0.01-0.2%)

### Enable Trailing Strategy
Settings > Strategy Tab > Trailing > Enable Trailing

### Enable Block/DCA Adjustments
Settings > Strategy Tab > Adjustment Strategies

---

## Important Notes

⚠️ **Position Cost is NOT percentage of balance** - It's used for indication/strategy calculations only

⚠️ **Database Size Changes** - Require engine pause and reorganization (automatic)

⚠️ **Volume Calculations** - Only occur at Main level for Adjust strategies, nowhere else

⚠️ **Real Level** - Just counts/validates from Main level (no calculations)

---

## Settings File Locations

| Component | File |
|-----------|------|
| Settings Page | `app/settings/page.tsx` |
| Settings Types | `lib/types.ts` |
| Settings Database | `lib/database.ts` |
| Volume Calculator | `lib/volume-calculator.ts` |
| Indication Settings | `lib/indication-state-manager.ts` |
| Strategy Settings | `lib/strategies.ts` |
| Documentation | `SETTINGS_DOCUMENTATION.md` |

---

## Troubleshooting

**Settings not saving?**
- Check browser console for errors
- Verify database connection status
- Try export/import through Backup tab

**Toast message not showing?**
- Verify engine status in System section
- Check if database reorganization is in progress
- Reload page if stuck

**Changes not taking effect?**
- Verify engines are running (System tab)
- Check engine logs for errors
- Restart engines if needed

---

*Last Updated: 2025-01-25 | v3.1*
