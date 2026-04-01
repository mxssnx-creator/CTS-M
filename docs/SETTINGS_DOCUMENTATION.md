# CTS v3.1 Settings Documentation
## Complete Reference for Settings Restoration and Repair

Last Updated: 2025-01-25

---

## Table of Contents
1. [Settings Interface Structure](#settings-interface-structure)
2. [Overall Tab Settings](#overall-tab-settings)
3. [Exchange Tab Settings](#exchange-tab-settings)
4. [Indication Tab Settings](#indication-tab-settings)
5. [Strategy Tab Settings](#strategy-tab-settings)
6. [System Tab Settings](#system-tab-settings)
7. [Default Values Reference](#default-values-reference)
8. [Critical Settings Notes](#critical-settings-notes)

---

## Settings Interface Structure

### Main Tabs:
- **Overall** - Core trading parameters (Main, Connection, Monitoring, Install, Backup)
- **Exchange** - Exchange connection and symbol configuration
- **Indication** - Indication settings (Main, Optimal, Common, Auto, Active)
- **Strategy** - Strategy settings (Main, Real, Preset)
- **System** - System configuration and trade engine settings

---

## Overall Tab Settings

### Overall > Main

#### Data & Timeframe Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Days of Prehistoric Data | `prehistoricDataDays` | number | 1-15 | 5 | Historical data to load on startup |
| Market Timeframe | `marketTimeframe` | number | 1,5,15,30,60,300 | 1 | Market data update interval (seconds) |

#### Volume Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Base Volume Factor | `base_volume_factor` | number | 0.5-10 step 0.5 | 1.0 | Position volume multiplier |
| Range Percentage (Loss Trigger) | `negativeChangePercent` | number | 5-30 step 5 | 20 | Market price change % to trigger loss calculation |
| Positions Average | `positions_average` | number | 20-300 step 10 | 50 | Target positions count for volume averaging |
| Minimum Volume Enforcement | `min_volume_enforcement` | boolean | - | true | Require minimum trading volume |

#### Position Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Position Cost Percentage | `positionCost` | number | 0.01-0.2 step 0.01 | 0.1 | Position cost % for indication/strategy calculations (Independent from balance!) |

#### Leverage Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Leverage Percentage | `leveragePercentage` | number | 5-100 step 5 | 100 | Percentage of max leverage to use |
| Max Leverage | `max_leverage` | number | 1-125 | 125 | Maximum leverage allowed |
| Use Maximal Leverage | `useMaximalLeverage` | boolean | - | true | Always use maximum available leverage |

#### Symbol Settings (To be added to Overall/Main)
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Use Main Symbols | `use_main_symbols` | boolean | - | false | Trade only configured main symbols |
| Number of Symbols | `numberOfSymbolsToSelect` | number | 1-30 | 12 | Number of symbols to select from exchange |
| Symbol Order Type | `symbolOrderType` | string | volume24h,marketCap,etc | volume24h | How symbols are sorted |
| Main Symbols | `mainSymbols` | string[] | - | ["BTC","ETH","BNB","XRP","ADA","SOL"] | Primary trading symbols |
| Forced Symbols | `forcedSymbols` | string[] | - | ["XRP","BCH"] | Symbols always included |

### Overall > Connection

#### Connection Defaults
| Setting | Key | Type | Options | Default | Description |
|---------|-----|------|---------|---------|-------------|
| Default Margin Type | `defaultMarginType` | string | cross, isolated | cross | Default margin type for new connections |
| Default Position Mode | `defaultPositionMode` | string | hedge, one-way | hedge | Default position mode |
| Rate Limit Delay | `rateLimitDelayMs` | number | 0+ | 50 | Delay between API requests (ms) |
| Max Concurrent Connections | `maxConcurrentConnections` | number | 1+ | 3 | Maximum active connections |
| Enable Testnet by Default | `enableTestnetByDefault` | boolean | - | false | Use testnet for new connections |

### Overall > Monitoring

| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Enable System Monitoring | `enableSystemMonitoring` | boolean | - | true | Enable system monitoring |
| Metrics Retention Days | `metricsRetentionDays` | number | 7-90 | 30 | Days to keep metrics data |
| Auto-restart on Errors | `autoRestartOnError` | boolean | - | true | Automatically restart on failure |
| Restart Cooldown Minutes | `restartCooldownMinutes` | number | 1-30 | 5 | Time between auto restarts |
| Max Restart Attempts | `maxRestartAttempts` | number | 1-10 | 3 | Max auto restart attempts |

---

## Exchange Tab Settings

### Exchange Connection Selection
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Selected Exchange Connection | `selectedExchangeConnection` | string (state) | first active | Currently selected exchange |

### Trade Volume Factors
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Main Trade Volume Factor | `baseVolumeFactorLive` | number | 0.1-10 step 0.1 | 1.0 | Position size multiplier for main trading |
| Preset Trade Volume Factor | `baseVolumeFactorPreset` | number | 0.1-10 step 0.1 | 1.0 | Position size multiplier for preset trading |

### Symbol Selection Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Order Symbols By | `symbolOrderType` | string | see options | volume24h | Symbol sorting method |
| Use Main Symbols Only | `use_main_symbols` | boolean | - | false | Trade only main symbols |
| Number of Symbols | `numberOfSymbolsToSelect` | number | 2-30 | 12 | Symbols to select |
| Quote Asset | `quoteAsset` | string | USDT,BUSD,USDC,BTC,ETH | USDT | Base quote asset |
| Min Volume Enforcement | `min_volume_enforcement` | boolean | - | true | Require minimum volume |

### Position Cost Configuration (Exchange)
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Exchange Position Cost | `exchangePositionCost` | number | 0.01-0.2 step 0.01 | 0.1 | Synced with positionCost |

### Main Trade Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Profit Factor Minimum | `profitFactorMinMain` | number | 0.1-2.0 step 0.1 | 0.6 | Min profit factor for main |
| Drawdown Time | `drawdownTimeMain` | number | 60-1440 step 60 | 300 | Drawdown time (minutes) |
| Main Direction Enabled | `mainDirectionEnabled` | boolean | - | true | Direction indication |
| Main Move Enabled | `mainMoveEnabled` | boolean | - | true | Move indication |
| Main Active Enabled | `mainActiveEnabled` | boolean | - | true | Active indication |
| Main Optimal Enabled | `mainOptimalEnabled` | boolean | - | false | Optimal indication |
| Main Trailing Strategy | `mainTrailingStrategy` | boolean | - | false | Trailing strategy |
| Main Block Strategy | `mainBlockStrategy` | boolean | - | false | Block strategy |
| Main DCA Strategy | `mainDcaStrategy` | boolean | - | false | DCA strategy |

### Preset Trade Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Profit Factor Minimum | `profitFactorMinPreset` | number | 0.1-2.0 step 0.1 | 0.6 | Min profit factor for preset |
| Drawdown Time | `drawdownTimePreset` | number | 60-1440 step 60 | 300 | Drawdown time (minutes) |
| Preset Direction Enabled | `presetDirectionEnabled` | boolean | - | true | Direction indication |
| Preset Move Enabled | `presetMoveEnabled` | boolean | - | true | Move indication |
| Preset Active Enabled | `presetActiveEnabled` | boolean | - | true | Active indication |
| Preset Optimal Enabled | `presetOptimalEnabled` | boolean | - | false | Optimal indication |
| Preset Trailing Strategy | `presetTrailingStrategy` | boolean | - | false | Trailing strategy |
| Preset Block Strategy | `presetBlockStrategy` | boolean | - | false | Block strategy |
| Preset DCA Strategy | `presetDcaStrategy` | boolean | - | false | DCA strategy |

---

## Indication Tab Settings

### Main Indications
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Market Activity Enabled | `marketActivityEnabled` | boolean | - | **true** | Enable market activity monitoring |
| Market Activity Range | `marketActivityCalculationRange` | number | - | 10 | Calculation range |
| Market Activity Ratio | `marketActivityPositionCostRatio` | number | - | 2 | Position cost ratio |
| Direction Enabled | `directionEnabled` | boolean | - | **true** | Enable direction indication |
| Direction Interval | `directionInterval` | number | - | 100 | Interval |
| Direction Timeout | `directionTimeout` | number | - | 3 | Timeout |
| Direction Range From | `directionRangeFrom` | number | - | 3 | Range from |
| Direction Range To | `directionRangeTo` | number | - | 30 | Range to |
| Move Enabled | `moveEnabled` | boolean | - | **true** | Enable move indication |
| Move Interval | `moveInterval` | number | - | 100 | Interval |
| Move Timeout | `moveTimeout` | number | - | 3 | Timeout |
| Active Enabled | `activeEnabled` | boolean | - | **true** | Enable active indication |
| Active Interval | `activeInterval` | number | - | 100 | Interval |
| Active Timeout | `activeTimeout` | number | - | 3 | Timeout |

### Active Factor (formerly Position Cost Ratio Index)
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Market Activity Position Cost Ratio | `marketActivityPositionCostRatio` | number | - | 2 | Active Factor: Calculation = Position Cost × Market Activity × Ratio |

### Optimal Indication Settings
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Optimal Coordination Enabled | `optimalCoordinationEnabled` | boolean | false | Enable optimal coordination |
| Trailing Optimal Ranges | `trailingOptimalRanges` | boolean | false | Use trailing for optimal |
| Simultaneous Trading | `simultaneousTrading` | boolean | false | Allow simultaneous trades |
| Position Increment After Situation | `positionIncrementAfterSituation` | boolean | false | Increment positions |

### Common Indicators
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| RSI Enabled | `rsiEnabled` | boolean | false | Enable RSI indicator |
| RSI Period | `rsiPeriod` | number | 14 | RSI period |
| RSI Oversold | `rsiOversold` | number | 30 | Oversold level |
| RSI Overbought | `rsiOverbought` | number | 70 | Overbought level |
| MACD Enabled | `macdEnabled` | boolean | false | Enable MACD |
| MACD Fast Period | `macdFastPeriod` | number | 12 | Fast period |
| MACD Slow Period | `macdSlowPeriod` | number | 26 | Slow period |
| MACD Signal Period | `macdSignalPeriod` | number | 9 | Signal period |
| Bollinger Enabled | `bollingerEnabled` | boolean | false | Enable Bollinger Bands |
| Bollinger Period | `bollingerPeriod` | number | 20 | Period |
| Bollinger StdDev | `bollingerStdDev` | number | 2 | Standard deviation |

---

## Strategy Tab Settings

### Base Strategy
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Base Value Range Min | `baseValueRangeMin` | number | - | 0.5 | Min value range |
| Base Value Range Max | `baseValueRangeMax` | number | - | 2.5 | Max value range |
| Base Ratio Min | `baseRatioMin` | number | - | 0.2 | Min ratio |
| Base Ratio Max | `baseRatioMax` | number | - | 1.0 | Max ratio |
| Trailing Option | `trailingOption` | boolean | - | false | Enable trailing |

### Main Strategy
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Previous Positions Count | `previousPositionsCount` | number | - | 5 | Previous positions count |
| Last State Count | `lastStateCount` | number | - | 3 | Last state count |

### Trailing Configuration
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Trailing Enabled | `trailingEnabled` | boolean | true | Enable trailing |
| Trailing Start Values | `trailingStartValues` | string | "0.5, 1.0, 1.5" | Start values |
| Trailing Stop Values | `trailingStopValues` | string | "0.2, 0.4, 0.6" | Stop values |

### Adjustment Strategies
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Block Adjustment | `blockAdjustment` | boolean | true | Enable block adjustment |
| DCA Adjustment | `dcaAdjustment` | boolean | false | Enable DCA adjustment |
| Block Enabled | `block_enabled` | boolean | true | Block strategy enabled |
| DCA Enabled | `dca_enabled` | boolean | false | DCA strategy enabled |

### Profit Factors
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Base Profit Factor | `baseProfitFactor` | number | - | 0.6 | Base strategy min profit |
| Main Profit Factor | `mainProfitFactor` | number | - | 0.6 | Main strategy min profit |
| Real Profit Factor | `realProfitFactor` | number | - | 0.6 | Real strategy min profit |

---

## System Tab Settings

### Trade Engine Configuration

#### Active Engines
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Main Engine Enabled | `mainEngineEnabled` | boolean | **true** | Enable main trade engine |
| Preset Engine Enabled | `presetEngineEnabled` | boolean | **true** | Enable preset trade engine |

#### Trade Mode
| Setting | Key | Type | Options | Default | Description |
|---------|-----|------|---------|---------|-------------|
| Trade Mode | `tradeMode` | string | both, main, preset | both | Active trading mode |

#### Engine Processing Intervals
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Main Engine Interval | `mainEngineIntervalMs` | number | 50-1000 step 50 | 100 | Main engine interval (ms) |
| Preset Engine Interval | `presetEngineIntervalMs` | number | 50-1000 step 50 | 100 | Preset engine interval (ms) |
| Active Order Handling | `activeOrderHandlingIntervalMs` | number | 50-1000 step 50 | 50 | Active order interval (ms) |

#### Position Management
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Position Cooldown | `positionCooldownMs` | number | 50-3000 step 50 | 100 | Cooldown between positions (ms) |
| Max Positions Per Config/Direction | `maxPositionsPerConfigDirection` | number | 1-5 | 1 | Max positions per config and direction |
| Max Concurrent Operations | `maxConcurrentOperations` | number | 10-250 | 100 | Max concurrent system operations |

### Database Size Configuration
| Setting | Key | Type | Range | Default | Description |
|---------|-----|------|-------|---------|-------------|
| Database Size Base | `databaseSizeBase` | number | 50-750 step 50 | 250 | Base database size |
| Database Size Main | `databaseSizeMain` | number | 50-750 step 50 | 250 | Main database size |
| Database Size Real | `databaseSizeReal` | number | 50-750 step 50 | 250 | Real database size |
| Database Size Preset | `databaseSizePreset` | number | 50-750 step 50 | 250 | Preset database size |

### Database Management
| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Max Database Size MB | `maxDatabaseSizeMB` | number | 10240 | Max database size |
| Database Threshold Percent | `databaseThresholdPercent` | number | 80 | Cleanup threshold |
| Automatic Database Cleanup | `automaticDatabaseCleanup` | boolean | true | Enable auto cleanup |
| Automatic Database Backups | `automaticDatabaseBackups` | boolean | true | Enable auto backups |
| Backup Interval | `backupInterval` | string | daily | Backup frequency |

---

## Default Values Reference

### Initial Settings Object (for restoration)

\`\`\`javascript
const initialSettings = {
  // Overall / Main
  base_volume_factor: 1.0,
  positions_average: 50,
  max_leverage: 125,
  negativeChangePercent: 20,
  leveragePercentage: 100,
  prehistoricDataDays: 5,
  marketTimeframe: 1,
  positionCost: 0.1, // 0.1% - NOT 10%!
  useMaximalLeverage: true,

  // Base Strategy
  baseValueRangeMin: 0.5,
  baseValueRangeMax: 2.5,
  baseRatioMin: 0.2,
  baseRatioMax: 1,
  trailingOption: false,

  // Main Strategy
  previousPositionsCount: 5,
  lastStateCount: 3,

  // Trailing Configuration
  trailingEnabled: true,
  trailingStartValues: "0.5, 1.0, 1.5",
  trailingStopValues: "0.2, 0.4, 0.6",

  // Adjustment Strategies
  blockAdjustment: true,
  dcaAdjustment: false,
  block_enabled: true,
  dca_enabled: false,

  // Symbol Selection
  arrangementType: "marketCap24h",
  numberOfSymbolsToSelect: 12,
  quoteAsset: "USDT",
  mainSymbols: ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL"],
  forcedSymbols: ["XRP", "BCH"],

  // Profit Factors
  baseProfitFactor: 0.6,
  mainProfitFactor: 0.6,
  realProfitFactor: 0.6,

  // Trade Engine Intervals
  mainEngineIntervalMs: 100,
  presetEngineIntervalMs: 100,
  activeOrderHandlingIntervalMs: 50,

  // Database Size
  databaseSizeBase: 250,
  databaseSizeMain: 250,
  databaseSizeReal: 250,
  databaseSizePreset: 250,

  // Position Management
  positionCooldownMs: 100,
  maxPositionsPerConfigDirection: 1,
  maxConcurrentOperations: 100,

  // Engine Toggles
  mainEngineEnabled: true,
  presetEngineEnabled: true,

  // Main Indications - ALL ENABLED BY DEFAULT
  marketActivityEnabled: true,
  directionEnabled: true,
  moveEnabled: true,
  activeEnabled: true,

  // Exchange Volume Factors
  baseVolumeFactorLive: 1.0,
  baseVolumeFactorPreset: 1.0,
}
\`\`\`

---

## Critical Settings Notes

### Position Cost - IMPORTANT
- **Key**: `positionCost`
- **Range**: 0.01 - 0.2 (representing 0.01% to 0.2%)
- **Default**: 0.1 (representing 0.1%)
- **CRITICAL**: This is NOT a percentage of balance! It is used for:
  - Indication/strategy step calculations
  - Fee factor calculations
  - Independent from account balance

### Main Symbols and Forced Symbols
- `mainSymbols`: Primary trading symbols list
- `forcedSymbols`: Symbols always included regardless of selection criteria
- Both should be stored as arrays of uppercase symbol names without quote asset suffix

### Engine Intervals
- All intervals are in milliseconds (ms)
- Range: 50-1000ms
- Lower values = faster processing but more CPU usage
- Active Order Handling should be fastest (default 50ms)

### Database Size Configuration
- Changes require engine pause and database reorganization
- Applied automatically when saving settings with size changes

---

## Restoration Procedure

1. Export current settings using Export button
2. Compare with this documentation
3. Fix any incorrect values using the reference tables above
4. Import corrected settings or manually adjust in UI
5. Save and verify engine restarts properly

---

## File Locations

- Settings Page: `app/settings/page.tsx`
- Settings Backup: `app/settings/page_backup.tsx`
- Database Settings: `lib/database.ts` (search for `getDefaultSettings`)
- Types: `lib/types.ts`
- Trade Engine: `lib/trade-engine/trade-engine.tsx`
- Volume Calculator: `lib/volume-calculator.ts`
- Indication Calculator: `lib/indication-calculator.ts`

---

*This documentation should be kept updated with any settings changes.*
