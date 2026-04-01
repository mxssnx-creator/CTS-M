# Volume Calculation Corrections - CTS v3.1

## Critical Architecture Principle

**BASE, MAIN, and REAL pseudo positions do NOT use volume calculations.**

They operate with:
- **Position COUNTS** (how many positions)
- **RATIOS** (factors relative to positionCost)
- **No volume values until Exchange level**

**Volume is ONLY calculated at the EXCHANGE level** when actual orders are executed.

## Why This Matters

### Incorrect Approach (Old)
\`\`\`typescript
// ❌ WRONG: Calculating volume at Base/Main/Real levels
const basePosition = {
  volume: calculateVolume(baseVolumeFactor), // NO!
  entryPrice: 50000,
  quantity: volume / entryPrice // NO!
}
\`\`\`

### Correct Approach (New)
\`\`\`typescript
// ✅ CORRECT: Using counts and ratios only
const basePseudoPosition = {
  positionCost: 0.1, // 10% of account
  ratio: 1.0, // Base ratio
  entryPrice: 50000,
  // NO volume field here
}

// Later at Exchange level:
const exchangePosition = {
  volume: calculateVolumeFromRatio(basePseudoPosition.positionCost, accountBalance),
  entryPrice: basePseudoPosition.entryPrice,
  quantity: volume / entryPrice
}
\`\`\`

## Pseudo Position Progression

### BASE Level
**Purpose:** Foundation calculation without limits
**Uses:** Position counts, ratios, positionCost
**Does NOT use:** Volume, quantity, account balance

\`\`\`typescript
interface BasePseudoPosition {
  id: string
  symbol: string
  indicationType: string
  direction: "long" | "short"
  entryPrice: number
  positionCost: number // Ratio: 0.01 to 1.0 (1% to 100%)
  takeprofitFactor: number // Multiplier: 2-22
  stoplossRatio: number // Ratio: 0.2-2.2
  // NO volume field
  // NO quantity field
}
\`\`\`

### MAIN Level
**Purpose:** Filter by strategy signals (step counts based on positionCost)
**Uses:** Step counts, cost ratios
**Does NOT use:** Volume calculations

\`\`\`typescript
interface MainPseudoPosition extends BasePseudoPosition {
  stepCount: number // How many cost steps from entry
  costRatio: number // Ratio relative to positionCost
  // Still NO volume
}
\`\`\`

### REAL Level
**Purpose:** Validate affordability using ratios
**Uses:** Position cost validation, ratio checks
**Does NOT use:** Actual volume until exchange execution

\`\`\`typescript
interface RealPseudoPosition extends MainPseudoPosition {
  isAffordable: boolean // Can account handle positionCost ratio?
  validated: boolean
  // Still NO volume - only at exchange level
}
\`\`\`

### EXCHANGE Level
**Purpose:** Execute actual orders with real volume
**Uses:** Account balance, leverage, actual volume calculation

\`\`\`typescript
interface ExchangePosition {
  // First time volume appears:
  accountBalance: number // Real account balance
  volume: number // Calculated: positionCost * accountBalance / (entryPrice * leverage)
  quantity: number // volume / entryPrice
  leverage: number
  marginUsed: number // Real margin calculation
}
\`\`\`

## Strategy Calculations: Block & DCA

### Block Strategy (Correct Implementation)
**Works with RATIOS, not volume:**

\`\`\`typescript
// ✅ CORRECT: Block uses ratio adjustments
function applyBlockAdjustment(
  positions: PseudoPosition[],
  baseRatio: number,
  blockSize: number,
  adjustmentRatio: number
): number {
  const blocks = groupIntoBlocks(positions, blockSize)
  const lastBlock = blocks[blocks.length - 1]
  
  // Check if last block was negative
  const blockProfitFactor = calculateAvgProfitFactor(lastBlock)
  
  if (blockProfitFactor < 0) {
    // Increase RATIO, not volume
    return baseRatio * (1 + adjustmentRatio)
  }
  
  return baseRatio
}
\`\`\`

### DCA Strategy (Correct Implementation)
**Works with FACTORS, not volume:**

\`\`\`typescript
// ✅ CORRECT: DCA uses factor adjustments
function applyDCAdjustment(
  positions: PseudoPosition[],
  currentFactor: number,
  dcaLevels: number
): number {
  const lossPositions = positions.filter(p => p.profit_factor < 0)
  
  if (lossPositions.length > 0) {
    // Adjust FACTOR based on loss ratio
    const lossRatio = lossPositions.length / positions.length
    return currentFactor * (1 + lossRatio)
  }
  
  return currentFactor
}
\`\`\`

## Position Cost Format

**Position Cost is ALWAYS a ratio/percentage:**
- Format: `0.01` to `1.0` (representing 1% to 100%)
- Examples:
  - `0.1` = 10% of account balance
  - `0.05` = 5% of account balance
  - `1.0` = 100% of account balance

**Volume Calculation (ONLY at Exchange Level):**
\`\`\`typescript
// ✅ CORRECT: Calculate volume from position cost ratio
function calculateVolume(
  positionCost: number, // 0.1 = 10%
  accountBalance: number, // $10,000
  entryPrice: number, // $50,000
  leverage: number // 125x
): number {
  // Amount to invest: 10% of $10,000 = $1,000
  const investmentAmount = accountBalance * positionCost
  
  // With 125x leverage: $1,000 * 125 = $125,000 position size
  const positionSize = investmentAmount * leverage
  
  // Volume (quantity): $125,000 / $50,000 = 2.5 BTC
  const volume = positionSize / entryPrice
  
  return volume
}
\`\`\`

## Common Mistakes to Avoid

### Mistake 1: Volume in Pseudo Positions
\`\`\`typescript
// ❌ WRONG
const pseudoPosition = {
  symbol: "BTC/USD",
  volume: 2.5, // NO! Pseudo positions don't have volume
  entryPrice: 50000
}
\`\`\`

\`\`\`typescript
// ✅ CORRECT
const pseudoPosition = {
  symbol: "BTC/USD",
  positionCost: 0.1, // 10% ratio only
  entryPrice: 50000
}
\`\`\`

### Mistake 2: Volume-based Strategy Adjustments
\`\`\`typescript
// ❌ WRONG
function adjustVolume(baseVolume: number, adjustment: number): number {
  return baseVolume * adjustment // Wrong! Working with volume
}
\`\`\`

\`\`\`typescript
// ✅ CORRECT
function adjustRatio(baseRatio: number, adjustment: number): number {
  return baseRatio * adjustment // Correct! Working with ratios
}
\`\`\`

### Mistake 3: Account Balance in Base/Main/Real
\`\`\`typescript
// ❌ WRONG: Using account balance before Exchange level
const basePosition = await createBase({
  accountBalance: 10000, // NO! Not needed until Exchange
  volume: calculateVolume(accountBalance, price) // NO!
})
\`\`\`

\`\`\`typescript
// ✅ CORRECT: Only ratios at Base/Main/Real
const basePosition = await createBase({
  positionCost: 0.1, // Just the ratio
  // accountBalance used later at Exchange level
})
\`\`\`

## Implementation Checklist

- [ ] Base pseudo positions use positionCost (ratio) only
- [ ] Main filtering uses step counts, not volume
- [ ] Real validation checks affordability via ratios
- [ ] Volume calculated ONLY at Exchange level
- [ ] Block strategy adjusts ratios, not volumes
- [ ] DCA strategy adjusts factors, not volumes
- [ ] No account balance references before Exchange
- [ ] No quantity calculations before Exchange
- [ ] Position cost always in ratio format (0.01-1.0)
- [ ] Exchange level converts ratios to actual volumes

## Benefits of This Approach

1. **Independence:** Pseudo positions don't depend on account balance changes
2. **Scalability:** Same pseudo logic works for any account size
3. **Flexibility:** Easy to test strategies without real funds
4. **Clarity:** Clear separation between strategy (ratios) and execution (volumes)
5. **Performance:** Lighter calculations without volume math in filters

## Summary

**The Golden Rule:**
- **BASE/MAIN/REAL** = Counts + Ratios + Factors (NO VOLUME)
- **EXCHANGE** = Volume + Quantity + Actual Execution

This separation ensures the trading engine scales properly and strategies remain account-size independent.
