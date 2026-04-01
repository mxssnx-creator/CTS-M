# Performance Optimization: Volume Calculation Strategy

## System Architecture Overview

The CTS v3.1 system is optimized for performance by calculating volumes ONLY where needed:

### Level 1: Base Pseudo Positions (with Optional Trailing)
- **Purpose**: Test configuration viability (Phase 1: 10 pos, Phase 2: 50 pos)
- **Trailing**: ✅ ADDITIONAL logistics - applied as base expansion logic
- **Calculations**: Averages (avg_profit, avg_loss), Drawdown (max_drawdown, current_drawdown)
- **Volume**: ❌ NOT calculated - uses COUNTS and RATIOS only
- **Database**: Up to 250 entries per unique configuration set
- **Performance Impact**: MINIMAL - No exchange API calls, no volume calculations

**Metrics Tracked**:
- `win_rate`: winning_positions / total_positions
- `max_drawdown`: Peak-to-trough decline percentage
- `avg_profit`: Total profit / winning positions count
- `avg_loss`: Total loss / losing positions count

**Trailing Behavior**:
- Applied during position evaluation
- Expands positions based on favorable price movement
- Logged as additional expansion/contraction in statistics

---

### Level 2: Main Pseudo Positions (Independent Sets with Adjust Strategies)
- **Purpose**: Evaluate independent configurations and apply adjustments (DCA, Block)
- **Adjust Strategies**: ✅ Applied INDEPENDENTLY per configuration set
  - **DCA (Dollar Cost Averaging)**: Add positions at lower prices
  - **Block (Breakout)**: Add positions on breakout levels
  - **WITH Trailing**: Adjust strategies ALSO apply to configurations WITH trailing enabled
- **Calculations**: 
  - ✅ Volume calculations FOR ADJUST STRATEGIES only
  - ✅ Position cost-based step counting
  - ✅ Averages and drawdown (inherited from Base)
- **Database**: Up to 250 entries per configuration set
- **Performance Impact**: MODERATE - Volume calculated only for DCA/Block when activated

**Volume Usage**:
- Only when `adjust_strategy` = "dca" or "block" is applied
- Enables proper position sizing for additional entries
- Volume = positionCost × accountBalance ÷ currentPrice
- Applied per independent configuration set (TP/SL/Trailing combo)

**Metrics Tracked**:
- All Base metrics PLUS:
- `volume`: Calculated only when adjust strategies activate
- `position_cost_step`: Based on position cost ratios
- `step_min/max_ratio`: Validated ratios for multi-step entries

---

### Level 3: Real Pseudo Positions (Validation & Counting)
- **Purpose**: Count and validate positions from Main level for specific factors
- **Calculations**: 
  - ❌ NO active volume calculations (inherited from Main)
  - ✅ Validates volumes from Main pseudo positions
  - ✅ Counts positions by factor/category
  - ✅ Averages and drawdown (inherits from Main)
- **Database**: Links to Main positions, validates against factors
- **Performance Impact**: MINIMAL - Only counting/validation logic

**Validation Logic**:
- Verifies position exists in Main level
- Checks volume against exchange minimums
- Validates leverage factors
- Counts positions for risk monitoring

---

### Level 4: Exchange Positions (Actual Live Trading Log)
- **Purpose**: Log actual exchange live positions for statistics and performance comparison
- **Volume**: ✅ Pre-calculated from Main → no new volume calculations
- **Calculations**: 
  - ✅ All position metrics (PnL, fees, funding, max_profit, max_loss, drawdown, hold_duration)
  - ✅ Statistics tracking (win rate, profit factor per symbol/indication type)
  - ❌ NO new volume calculations - inherits from Main
- **Database**: Active exchange positions tracking (REMOVED volume_calculator from mirrorToExchange)
- **Performance Impact**: LOW - Only metrics and statistics tracking, no API calls

**Statistics Tracked**:
- Per-symbol per-24h statistics
- Win rate, profit factor, drawdown
- Average hold duration
- Best/worst trades
- Total volume (inherited from Main)

---

## Performance Implications

### No Volume Calculation Layers (Base, Real, Exchange)
\`\`\`
Base Pseudo Positions: ~1-2ms per position update
Real Pseudo Positions: ~2-3ms per position validation
Exchange Positions: ~3-5ms per position logging (statistics only)
Total Base→Real→Exchange: ~6-10ms for 250 positions
\`\`\`

### Volume Calculation Layers (Main with Adjust)
\`\`\`
Main Pseudo Positions (with adjust): ~5-10ms per position (volume calc ONLY for adjust)
Volume calculations ONLY when adjust_strategy is "dca" or "block"
\`\`\`

### System Throughput
- **Base Level**: Can handle 100+ concurrent position updates per second
- **Main Level**: Can handle 50+ concurrent position calculations per second (volume only on adjust)
- **Real Level**: Can handle 200+ concurrent validations per second
- **Exchange Level**: Can handle 500+ concurrent statistics updates per second

---

## Optimization Rules

### ✅ DO Calculate Volume When:
1. Creating Main pseudo positions with adjust strategies (DCA, Block) ACTIVATED
2. Calculating position cost ratios for multi-step entries
3. Validating exchange order parameters (from Main calculation)

### ❌ DON'T Calculate Volume When:
1. Testing configurations at Base level - use COUNTS only
2. Counting/validating positions at Real level
3. Logging positions to Exchange level - inherit from Main
4. Calculating performance metrics (win rate, drawdown)
5. Updating pseudo position prices

### ✅ DO Calculate Averages/Drawdown When:
1. Base pseudo positions close (Phase 1/2 evaluation)
2. Main pseudo positions update (for monitoring)
3. Exchange positions update (for performance tracking)

### ❌ DON'T Calculate Averages When:
1. Only price updates - use incremental calculations
2. More frequent than 1 second for pseudo positions
3. For positions that are still evaluating (Phase 1/2)

---

## Architecture Clarification

### Trailing (Additional Category)
- Applied at **Base level** as expansion logic
- Can be combined with any indication type/range
- Expands position management based on price movement
- Tracked in base position statistics

### Adjust Strategies (DCA/Block - Category Specific)
- Applied at **Main level** per independent set
- DCA: Adds positions at cost-weighted intervals
- Block: Adds positions on breakout confirmations
- Can be applied to ANY configuration, including those WITH trailing enabled
- Only time volume is calculated for Main positions

### Exchange Positions
- **No new calculations** - inherit pre-calculated volumes from Main
- **Statistics only** - track performance, win rate, drawdown
- **Comparison only** - compare Real pseudo positions vs actual exchange fills

---

## Async Processing for Performance

All position updates use async batch processing:

\`\`\`typescript
// Batch size: 50 positions per batch
// Processing: Parallel with Promise.all()
// Interval: 1 second for pseudo positions, 100ms for exchange statistics
// Rate limiting: 10ms delay between batches to prevent CPU spike
\`\`\`

---

## Database Optimization

### Indexes for Performance
- \`base_pseudo_positions\`: (connection_id, symbol, status, indication_type)
- \`preset_pseudo_positions\`: (connection_id, preset_type_id, status)
- \`active_exchange_positions\`: (connection_id, symbol, status, opened_at DESC)
- \`exchange_position_statistics\`: (connection_id, symbol, period_start DESC)

### Query Optimization
- Use materialized view \`v_active_exchange_positions_monitoring\` for complex queries
- Cache balance in \`connection_balances\` (updated hourly via cron)
- Use batch inserts for statistics updates

---

## Monitoring Performance

### Key Metrics to Track
1. **Position Update Duration**: Target <5ms per position (Base/Real)
2. **Volume Calculation Duration**: Target <10ms per position (Main with adjust only)
3. **Statistics Update Duration**: Target <5ms per position (Exchange)
4. **Batch Processing Time**: Target <50ms for 50-position batch
5. **Memory Usage**: Track active position tracking maps

### Warning Thresholds
- Base position update > 10ms → investigate query performance
- Main volume calculation > 20ms → check when adjust strategies activate
- Real validation > 10ms → check position count per set
- Statistics update > 100ms → reduce batch size
- Memory for active positions > 100MB → purge old positions from cache
