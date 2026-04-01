# CTS v3.1 Trade Engine Architecture

## Position Limit Clarification

### What "50" and "250" Mean:

| Value | Meaning | Type |
|-------|---------|------|
| **50** | Phase 2 evaluation threshold | Performance checkpoint |
| **250** | Database entries per configuration set | Configurable size limit |
| **Unlimited** | Total configurations across system | No overall limit |

### Key Principle: INDEPENDENT Configuration Sets

Each unique configuration creates its OWN INDEPENDENT set:
- Configuration = TP Factor + SL Ratio + Trailing Settings + Direction + Range
- Each set has its OWN 250 entry limit (configurable)
- NO overall position limit across configurations

## Main Trade Engine vs Preset Trade Engine

### Main Trade Engine (lib/trade-engine.ts)
- Uses MAIN INDICATIONS ONLY: Direction, Move, Active, Optimal
- Step-based counting from position cost
- NO Common Indicators (RSI, MACD, Bollinger, etc.)
- Processes: Base → Main → Real progression

### Preset Trade Engine (lib/preset-trade-engine.ts)  
- Supports BOTH indication categories:
  - **Main Indications**: Direction, Move, Active, Optimal (step-based)
  - **Common Indicators**: RSI, MACD, Bollinger, ParabolicSAR, ADX, ATR
- Configurable per preset type
- Independent from Main Engine

## Progression Flow (Main Engine)

\`\`\`
BASE PSEUDO POSITIONS (Unlimited configurations, 250 per set)
    │
    │ Evaluation: Phase 1 (10 positions), Phase 2 (50 positions)
    │ Filter: Win rate, profit factor thresholds
    ▼
MAIN PSEUDO POSITIONS (Filtered from Base, 250 per set)
    │
    │ Filter: Min profit factor, validated configurations
    │ Just COUNTING and EVALUATING from Base
    ▼
REAL PSEUDO POSITIONS (Filtered from Main, 250 per set)
    │
    │ Filter: Production-ready configurations
    │ No limits - just counting/evaluating
    ▼
EXCHANGE POSITIONS (When live/preset trade enabled)
    │
    │ Volume calculated ONLY here
    │ Actual order placement
    ▼
LIVE TRADING
\`\`\`

## Configuration Independence

### Each Configuration is Completely Independent:

\`\`\`
Configuration A: BTC/USDT, Direction, Range 5, Long, TP=2, SL=0.5, No Trailing
    → Own 250 entry limit
    → Own performance tracking
    → Own phase progression

Configuration B: BTC/USDT, Direction, Range 5, Long, TP=2, SL=0.5, Trailing(0.5, 0.2)
    → DIFFERENT set (trailing differs)
    → Own 250 entry limit
    → Own performance tracking

Configuration C: BTC/USDT, Move, Range 5, Long, TP=2, SL=0.5, No Trailing
    → DIFFERENT set (indication type differs)
    → Own 250 entry limit
    → Own performance tracking
\`\`\`

### Database Size Settings (Configurable):

| Setting | Default | Description |
|---------|---------|-------------|
| `databaseSizeBase` | 250 | Max entries per Base configuration set |
| `databaseSizeMain` | 250 | Max entries per Main configuration set |
| `databaseSizeReal` | 250 | Max entries per Real configuration set |
| `databaseSizePreset` | 250 | Max entries per Preset configuration set |

## Async Processing Architecture

### Batch Processing:
\`\`\`typescript
// All engines use async batch processing
const batches = this.createBatches(symbols, BATCH_SIZE)

for (const batch of batches) {
  await Promise.all(
    batch.map(async (symbol) => {
      // Process each symbol in parallel
    })
  )
  // Rate limiting between batches
  await this.delay(RATE_LIMIT_DELAY)
}
\`\`\`

### Non-Overlapping Intervals:
- Main Engine: 100ms default (configurable)
- Preset Engine: 100ms default (configurable)  
- Active Order Handling: 50ms default

### Lock-Free Processing:
\`\`\`typescript
// Prevents interval overlap
private lastIntervalComplete = true

if (!this.lastIntervalComplete) {
  return // Skip if previous interval still running
}

this.lastIntervalComplete = false
try {
  await this.processInterval()
} finally {
  this.lastIntervalComplete = true
}
\`\`\`

## Indication Processing

### Main Indications (Step-Based):

| Type | Detection Method | Expected Result |
|------|-----------------|-----------------|
| **Direction** | Consecutive opposite steps | Reversal direction |
| **Move** | Consecutive same-direction steps | Continuation direction |
| **Active** | Volatility + volume analysis | Activity level |
| **Optimal** | Combined direction + market change | Optimal entry |

### Validation Percentages:

| Metric | Default | Meaning |
|--------|---------|---------|
| Initial Win Rate | 40% | Phase 1 threshold (10 positions) |
| Expanded Win Rate | 45% | Phase 2 threshold (50 positions) |
| Profit Ratio | 1.2x | Phase 2 profit/loss ratio |
| Pause Threshold | 38% | Win rate degradation trigger |
| Resume Threshold | 43% | Recovery requirement |
| Max Drawdown | 30% | Production limit |

## Position Cost (NOT Volume)

### Base/Main/Real Levels:
- Use COUNTS and RATIOS only
- NO volume calculations
- Position cost = percentage of available capital (0.1 = 10%)

### Exchange Level Only:
- Volume calculated when mirroring to exchange
- Actual order quantity determined here
- Based on position cost ratio × available balance

## Real Exchange Trading

### When Live Trade or Preset Trade Enabled:

1. Validated configuration reaches Real level
2. Exchange position manager calculates actual volume
3. Order placed via exchange connector
4. Position tracked in exchange_positions table
5. Updates synced with pseudo position

### Safety Features:
- Rate limiting per exchange
- Max positions per exchange (configurable)
- Cooldown between positions (20 seconds)
- Validation timeout (configurable per indication type)
