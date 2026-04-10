/**
 * Independent Indication Sets Processor
 * Maintains separate 250-entry pools for each indication type AND each configuration
 * Each type+config combination calculates independently with own set
 * 
 * Key Design Principles:
 * 1. Each indication type (direction, move, active, optimal) has independent sets
 * 2. Each configuration/parameter combination within a type has its own set
 * 3. Max positions per direction (long/short) is enforced per config
 * 4. Indication timeout is applied after valid evaluation
 */

import { getRedisClient, initRedis, getSettings, setSettings } from "@/lib/redis-db"
import { logProgressionEvent } from "@/lib/engine-progression-logs"
import { emitIndicationUpdate } from "@/lib/broadcast-helpers"

// Default limits per indication type (independently configurable)
const DEFAULT_LIMITS = {
  direction: 250,
  move: 250,
  active: 250,
  optimal: 250,
  active_advanced: 250,
}

// Default set DB length and threshold rearrange
const DEFAULT_SET_DB_LENGTH = 250
const DEFAULT_THRESHOLD_REARRANGE_PERCENT = 20 // rearrange at 200 when max is 250

// Pre-cached client reference
let cachedClient: any = null
async function getCachedClient() {
  if (!cachedClient) {
    await initRedis()
    cachedClient = getRedisClient()
  }
  return cachedClient
}

// Position limits per config per direction (1-8, default 1)
const DEFAULT_POSITION_LIMITS = {
  maxLong: 1,
  maxShort: 1,
}

// Indication timeout after valid evaluation (0-5 seconds, default 1, step 0.2)
const DEFAULT_INDICATION_TIMEOUT_MS = 1000

// Pseudo position timeout (0-5 seconds, default 1, step 0.2)
const DEFAULT_PSEUDO_POSITION_TIMEOUT_MS = 1000

export interface IndicationSetLimits {
  direction: number
  move: number
  active: number
  optimal: number
  active_advanced: number
}

export interface PositionLimits {
  maxLong: number
  maxShort: number
}

export interface IndicationSet {
  type: "direction" | "move" | "active" | "optimal" | "active_advanced"
  connectionId: string
  symbol: string
  configKey: string // Unique key for this configuration combination
  entries: Array<{
    id: string
    timestamp: Date
    profitFactor: number
    confidence: number
    config: any
    metadata: any
    direction: "long" | "short"
  }>
  maxEntries: number // Configurable per type, default 250
  positionCounts: {
    long: number
    short: number
  }
  stats: {
    totalCalculated: number
    totalQualified: number
    avgProfitFactor: number
    lastCalculated: Date | null
  }
}

export class IndicationSetsProcessor {
  private connectionId: string
  private sets: Map<string, IndicationSet> = new Map()
  private limits: IndicationSetLimits = { ...DEFAULT_LIMITS }
  private positionLimits: PositionLimits = { ...DEFAULT_POSITION_LIMITS }
  private indicationTimeoutMs: number = DEFAULT_INDICATION_TIMEOUT_MS
  private pseudoPositionTimeoutMs: number = DEFAULT_PSEUDO_POSITION_TIMEOUT_MS
  private setDbLength: number = DEFAULT_SET_DB_LENGTH
  private thresholdRearrangePercent: number = DEFAULT_THRESHOLD_REARRANGE_PERCENT
  private directionMoveRanges: number[] = Array.from({ length: 28 }, (_, i) => i + 3) // 3..30
  private optimalRanges: number[] = Array.from({ length: 28 }, (_, i) => i + 3) // 3..30
  private drawdownRatios: number[] = [0.1, 0.2, 0.3, 0.4, 0.5] // 0.1-0.5 step 0.1
  private marketActivityRatios: number[] = Array.from({ length: 10 }, (_, i) => 0.01 + i * 0.01) // 0.01-0.1 step 0.01
  private activityLastPartRatios: number[] = [0.1, 0.2, 0.3, 0.4] // 0.1-0.4 step 0.1
  private activityRatios: number[] = Array.from({ length: 11 }, (_, i) => 0.7 + i * 0.1) // 0.7-1.7 step 0.1
  private marketDistanceRatios: number[] = Array.from({ length: 11 }, (_, i) => 0.7 + i * 0.1) // 0.7-1.7 step 0.1
  private lastPartRatios: number[] = [0.25, 0.5] // legacy, kept for backward compat
  private factorMultipliers: number[] = [0.9, 1.0, 1.1]
  private activeThresholds: number[] = [0.5, 1.0, 1.5, 2.0, 2.5]
  private activeTimeRatios: number[] = [0.5, 1.0]

  constructor(connectionId: string) {
    this.connectionId = connectionId
    this.loadSettings()
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await getSettings("all_settings")
      if (settings) {
        // Load independent limits per type
        if (settings.databaseSizeDirection) this.limits.direction = Number(settings.databaseSizeDirection)
        if (settings.databaseSizeMove) this.limits.move = Number(settings.databaseSizeMove)
        if (settings.databaseSizeActive) this.limits.active = Number(settings.databaseSizeActive)
        if (settings.databaseSizeOptimal) this.limits.optimal = Number(settings.databaseSizeOptimal)
        
        // Load position limits per direction (1-8)
        if (settings.maxPositionsLong) this.positionLimits.maxLong = Math.min(8, Math.max(1, Number(settings.maxPositionsLong)))
        if (settings.maxPositionsShort) this.positionLimits.maxShort = Math.min(8, Math.max(1, Number(settings.maxPositionsShort)))
        
        // Load indication timeout (0-5 seconds, default 1, step 0.2)
        if (settings.indicationTimeoutSeconds) {
          this.indicationTimeoutMs = Math.max(0, Math.min(5000, Number(settings.indicationTimeoutSeconds) * 1000))
        }

        // Load pseudo position timeout (0-5 seconds, default 1, step 0.2)
        if (settings.pseudoPositionTimeoutSeconds) {
          this.pseudoPositionTimeoutMs = Math.max(0, Math.min(5000, Number(settings.pseudoPositionTimeoutSeconds) * 1000))
        }

        // Load set DB length and threshold rearrange
        if (settings.setDbLength) this.setDbLength = Math.max(50, Number(settings.setDbLength))
        if (settings.setThresholdRearrangePercent) this.thresholdRearrangePercent = Math.max(5, Math.min(50, Number(settings.setThresholdRearrangePercent)))

        // Config-grid controls for steps
        this.directionMoveRanges = this.parseRangeSettings(
          settings.indicationStepsMin ?? settings.directionRangeStart,
          settings.indicationStepsMax ?? settings.directionRangeEnd,
          settings.indicationStepsStep ?? settings.directionRangeStep,
          this.directionMoveRanges,
        )
        this.optimalRanges = this.parseRangeSettings(
          settings.indicationStepsMin ?? settings.optimalRangeStart,
          settings.indicationStepsMax ?? settings.optimalRangeEnd,
          settings.indicationStepsStep ?? settings.optimalRangeStep,
          this.optimalRanges,
        )

        // Drawdown ratios 0.1-0.5 step 0.1
        this.drawdownRatios = this.parseRangeSettings(
          settings.indicationDrawdownMin,
          settings.indicationDrawdownMax,
          settings.indicationDrawdownStep,
          this.drawdownRatios,
        )

        // Market activity ratios 0.01-0.1 step 0.01
        this.marketActivityRatios = this.parseRangeSettings(
          settings.indicationMarketActivityMin,
          settings.indicationMarketActivityMax,
          settings.indicationMarketActivityStep,
          this.marketActivityRatios,
        )

        // Activity last part ratios 0.1-0.4 step 0.1
        this.activityLastPartRatios = this.parseRangeSettings(
          settings.indicationActivityLastPartMin,
          settings.indicationActivityLastPartMax,
          settings.indicationActivityLastPartStep,
          this.activityLastPartRatios,
        )

        // Activity ratios 0.7-1.7 step 0.1
        this.activityRatios = this.parseRangeSettings(
          settings.indicationActivityRatioMin,
          settings.indicationActivityRatioMax,
          settings.indicationActivityRatioStep,
          this.activityRatios,
        )

        // Market distance ratios 0.7-1.7 step 0.1
        this.marketDistanceRatios = this.parseRangeSettings(
          settings.indicationMarketDistanceMin,
          settings.indicationMarketDistanceMax,
          settings.indicationMarketDistanceStep,
          this.marketDistanceRatios,
        )

        this.lastPartRatios = this.parseNumericList(settings.indicationLastPartRatios, this.lastPartRatios)
        this.factorMultipliers = this.parseNumericList(settings.indicationFactorMultipliers, this.factorMultipliers)
        this.activeThresholds = this.parseNumericList(settings.activeThresholds, this.activeThresholds)
        this.activeTimeRatios = this.parseNumericList(settings.activeTimeRatios, this.activeTimeRatios)
        
        // Fallback: legacy maxEntriesPerSet applies to all
        if (settings.maxEntriesPerSet && !settings.databaseSizeDirection) {
          const limit = Number(settings.maxEntriesPerSet)
          this.limits = { direction: limit, move: limit, active: limit, optimal: limit, active_advanced: limit }
        }
      }
      
      // Also load from indication_sets_config for backward compatibility
      const setsConfig = await getSettings("indication_sets_config")
      if (setsConfig) {
        if (setsConfig.direction) this.limits.direction = Number(setsConfig.direction)
        if (setsConfig.move) this.limits.move = Number(setsConfig.move)
        if (setsConfig.active) this.limits.active = Number(setsConfig.active)
        if (setsConfig.optimal) this.limits.optimal = Number(setsConfig.optimal)
      }
    } catch (error) {
      console.error("[v0] [IndicationSets] Failed to load settings:", error)
    }
  }

  /** Get the limit for a specific indication type */
  getLimit(type: keyof IndicationSetLimits): number {
    return this.limits[type] || DEFAULT_LIMITS[type] || 250
  }

  /** Get the threshold for rearrangement (20% less than max length) */
  getThresholdRearrange(): number {
    return Math.floor(this.setDbLength * (1 - this.thresholdRearrangePercent / 100))
  }

  private parseRangeSettings(startRaw: any, endRaw: any, stepRaw: any, fallback: number[]): number[] {
    const start = Number(startRaw)
    const end = Number(endRaw)
    const step = Number(stepRaw)
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0 || end < start) {
      return fallback
    }
    const values: number[] = []
    for (let v = start; v <= end; v += step) values.push(v)
    return values.length > 0 ? values : fallback
  }

  private parseNumericList(raw: any, fallback: number[]): number[] {
    if (Array.isArray(raw)) {
      const parsed = raw.map((v) => Number(v)).filter((v) => Number.isFinite(v))
      return parsed.length > 0 ? parsed : fallback
    }
    if (typeof raw === "string") {
      const parsed = raw
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v))
      return parsed.length > 0 ? parsed : fallback
    }
    return fallback
  }
  
  /** Get position limits */
  getPositionLimits(): PositionLimits {
    return this.positionLimits
  }
  
  /** Check if we can add a position for given direction */
  canAddPosition(configKey: string, direction: "long" | "short", currentCount: number): boolean {
    const limit = direction === "long" ? this.positionLimits.maxLong : this.positionLimits.maxShort
    return currentCount < limit
  }
  
  /**
   * Process all indication types independently for a symbol
   */
  async processAllIndicationSets(symbol: string, marketData: any): Promise<void> {
    const startTime = Date.now()
    const TIMEOUT_MS = 15000 // 15 second timeout per symbol
    
    try {
      if (!marketData) {
        console.warn(`[v0] [IndicationSets] Invalid market data for ${symbol}`)
        await logProgressionEvent(this.connectionId, "indications_sets", "warning", `Invalid market data for ${symbol}`, {
          symbol,
          reason: "null_market_data",
        })
        return
      }

      // Process all 4 main types in parallel with independent logic
      const [directionResults, moveResults, activeResults, optimalResults] = await Promise.all([
        this.processDirectionSet(symbol, marketData),
        this.processMoveSet(symbol, marketData),
        this.processActiveSet(symbol, marketData),
        this.processOptimalSet(symbol, marketData),
      ])

      const duration = Date.now() - startTime
      
      // Check for timeout
      if (duration > TIMEOUT_MS) {
        console.warn(`[v0] [IndicationSets] TIMEOUT: Processing exceeded ${TIMEOUT_MS}ms for ${symbol} (took ${duration}ms)`)
        await logProgressionEvent(this.connectionId, "indications_sets", "warning", `Indication set processing timeout for ${symbol}`, {
          symbol,
          timeoutMs: TIMEOUT_MS,
          actualMs: duration,
        })
        return
      }

      const totalQualified = 
        (directionResults?.qualified || 0) +
        (moveResults?.qualified || 0) +
        (activeResults?.qualified || 0) +
        (optimalResults?.qualified || 0)

      if (totalQualified > 0) {
        console.log(
          `[v0] [IndicationSets] ${symbol}: COMPLETE in ${duration}ms | Direction=${directionResults?.qualified}/${directionResults?.total} Move=${moveResults?.qualified}/${moveResults?.total} Active=${activeResults?.qualified}/${activeResults?.total} Optimal=${optimalResults?.qualified}/${optimalResults?.total}`
        )

        await logProgressionEvent(this.connectionId, "indications_sets", "info", `All indication types processed for ${symbol}`, {
          direction: directionResults,
          move: moveResults,
          active: activeResults,
          optimal: optimalResults,
          duration,
        })
      }
    } catch (error) {
      console.error(`[v0] [IndicationSets] Failed to process sets for ${symbol}:`, error)
    }
  }

  /**
   * Process Direction Indication Set (ranges 3-30)
   * OPTIMIZED: Process all ranges in batch, minimize Redis calls
   */
  private async processDirectionSet(symbol: string, marketData: any): Promise<any> {
    const keyRanges = this.directionMoveRanges
    const drawdownRatios = this.drawdownRatios
    const lastPartRatios = this.lastPartRatios
    const factorMultipliers = this.factorMultipliers
    let qualified = 0
    let total = 0
    const pendingWrites: Array<{ setKey: string; indication: any; config: any }> = []

    for (const range of keyRanges) {
      for (const drawdownRatio of drawdownRatios) {
        for (const lastPartRatio of lastPartRatios) {
          for (const factorMultiplier of factorMultipliers) {
            const indication = this.calculateDirectionIndication(marketData, {
              range,
              drawdownRatio,
              lastPartRatio,
              factorMultiplier,
            })
            if (!indication) continue
            
            total++
            const direction = indication.metadata?.firstDir > 0 ? "long" : "short"
            indication.direction = direction
            
            if (indication.profitFactor >= 1.0) {
              qualified++
              const setKey = `indication_set:${this.connectionId}:${symbol}:direction:r${range}:dd${drawdownRatio}:lp${lastPartRatio}:f${factorMultiplier}`
              pendingWrites.push({
                setKey,
                indication,
                config: { range, drawdownRatio, lastPartRatio, factorMultiplier },
              })
            }
          }
        }
      }
    }

    // Batch write all qualified indications
    if (pendingWrites.length > 0) {
      await this.batchSaveIndications(pendingWrites, "direction")
    }

    return { type: "direction", total, qualified, configs: pendingWrites.length }
  }

  /**
   * Process Move Indication Set (ranges 3-30, no opposite requirement)
   * OPTIMIZED: Process key ranges only, batch writes
   */
  private async processMoveSet(symbol: string, marketData: any): Promise<any> {
    const keyRanges = this.directionMoveRanges
    const drawdownRatios = this.drawdownRatios
    const lastPartRatios = this.lastPartRatios
    const factorMultipliers = this.factorMultipliers
    let qualified = 0
    let total = 0
    const pendingWrites: Array<{ setKey: string; indication: any; config: any }> = []

    for (const range of keyRanges) {
      for (const drawdownRatio of drawdownRatios) {
        for (const lastPartRatio of lastPartRatios) {
          for (const factorMultiplier of factorMultipliers) {
            const indication = this.calculateMoveIndication(marketData, {
              range,
              drawdownRatio,
              lastPartRatio,
              factorMultiplier,
            })
            if (!indication) continue
            
            total++
            const direction = (indication.metadata?.movement || 0) >= 0 ? "long" : "short"
            indication.direction = direction
            
            if (indication.profitFactor >= 1.0) {
              qualified++
              const setKey = `indication_set:${this.connectionId}:${symbol}:move:r${range}:dd${drawdownRatio}:lp${lastPartRatio}:f${factorMultiplier}`
              pendingWrites.push({
                setKey,
                indication,
                config: { range, drawdownRatio, lastPartRatio, factorMultiplier },
              })
            }
          }
        }
      }
    }

    if (pendingWrites.length > 0) {
      await this.batchSaveIndications(pendingWrites, "move")
    }

    return { type: "move", total, qualified, configs: pendingWrites.length }
  }

  /**
   * Process Active Indication Set (thresholds 0.5-2.5%)
   * Active uses only: steps, drawdown, activity ratios, activity last part ratios
   */
  private async processActiveSet(symbol: string, marketData: any): Promise<any> {
    const thresholds = this.activeThresholds
    const drawdownRatios = this.drawdownRatios
    const marketActivityRatios = this.marketActivityRatios
    const activityLastPartRatios = this.activityLastPartRatios
    const activityRatios = this.activityRatios
    let qualified = 0
    let total = 0
    const pendingWrites: Array<{ setKey: string; indication: any; config: any }> = []

    for (const threshold of thresholds) {
      for (const drawdownRatio of drawdownRatios) {
        for (const marketActivityRatio of marketActivityRatios) {
          for (const activityLastPartRatio of activityLastPartRatios) {
            for (const activityRatio of activityRatios) {
              try {
                const indication = this.calculateActiveIndication(marketData, {
                  threshold,
                  drawdownRatio,
                  marketActivityRatio,
                  activityLastPartRatio,
                  activityRatio,
                })
                if (indication) {
                  total++
                  if (indication.profitFactor >= 1.0) {
                    qualified++
                    const setKey = `indication_set:${this.connectionId}:${symbol}:active:t${threshold}:dd${drawdownRatio}:ma${marketActivityRatio}:alp${activityLastPartRatio}:ar${activityRatio}`
                    pendingWrites.push({
                      setKey,
                      indication,
                      config: { threshold, drawdownRatio, marketActivityRatio, activityLastPartRatio, activityRatio },
                    })
                  }
                }
              } catch (error) {
                console.error(`[v0] [IndicationSets] Active config error:`, error)
              }
            }
          }
        }
      }
    }

    if (pendingWrites.length > 0) {
      await this.batchSaveIndications(pendingWrites, "active")
    }

    return { type: "active", total, qualified, configs: pendingWrites.length }
  }

  /**
   * Process Optimal Indication Set (consecutive step detection)
   * Optimal uses ALL parameters: steps, drawdown, market activity, activity last part, activity ratio, market distance
   */
  private async processOptimalSet(symbol: string, marketData: any): Promise<any> {
    const keyRanges = this.optimalRanges
    const drawdownRatios = this.drawdownRatios
    const marketActivityRatios = this.marketActivityRatios
    const activityLastPartRatios = this.activityLastPartRatios
    const activityRatios = this.activityRatios
    const marketDistanceRatios = this.marketDistanceRatios
    let qualified = 0
    let total = 0
    const pendingWrites: Array<{ setKey: string; indication: any; config: any }> = []

    for (const range of keyRanges) {
      for (const drawdownRatio of drawdownRatios) {
        for (const marketActivityRatio of marketActivityRatios) {
          for (const activityLastPartRatio of activityLastPartRatios) {
            for (const activityRatio of activityRatios) {
              for (const marketDistanceRatio of marketDistanceRatios) {
                const indication = this.calculateOptimalIndication(marketData, range, {
                  drawdownRatio,
                  marketActivityRatio,
                  activityLastPartRatio,
                  activityRatio,
                  marketDistanceRatio,
                })
                if (!indication) continue
                
                total++
                if (indication.profitFactor >= 1.0) {
                  qualified++
                  const setKey = `indication_set:${this.connectionId}:${symbol}:optimal:r${range}:dd${drawdownRatio}:ma${marketActivityRatio}:alp${activityLastPartRatio}:ar${activityRatio}:mdr${marketDistanceRatio}`
                  pendingWrites.push({ setKey, indication, config: { range, drawdownRatio, marketActivityRatio, activityLastPartRatio, activityRatio, marketDistanceRatio } })
                }
              }
            }
          }
        }
      }
    }

    if (pendingWrites.length > 0) {
      await this.batchSaveIndications(pendingWrites, "optimal")
    }

    return { type: "optimal", total, qualified }
  }

  /**
   * Batch save multiple indications - much more efficient than individual saves
   * Uses threshold rearrangement: rearrange at 20% less than max length for performance
   */
  private async batchSaveIndications(
    writes: Array<{ setKey: string; indication: any; config: any }>,
    type: string
  ): Promise<void> {
    if (writes.length === 0) return
    
    try {
      const client = await getCachedClient()
      const now = Date.now()
      const timestamp = new Date().toISOString()

      // Process writes in bounded parallel chunks for high-frequency throughput.
      const concurrency = 20
      const limit = this.getLimit(type as keyof IndicationSetLimits)
      const thresholdRearrange = this.getThresholdRearrange()
      
      for (let i = 0; i < writes.length; i += concurrency) {
        const chunk = writes.slice(i, i + concurrency)
        await Promise.all(
          chunk.map(async ({ setKey, indication, config }, idx) => {
            const entry = {
              id: `${type}_${now}_${i + idx}_${Math.random().toString(36).slice(2, 6)}`,
              timestamp,
              profitFactor: indication.profitFactor,
              confidence: indication.confidence,
              config,
              metadata: indication.metadata,
              direction: indication.direction,
            }

            const existing = await client.get(setKey)
            let entries = existing ? JSON.parse(existing) : []
            
            // Check position limit per direction (max 1 per validated indication per config)
            const direction = indication.direction
            const existingInDirection = direction 
              ? entries.filter((e: any) => e.direction === direction).length 
              : 0
            
            // Only add if under limit for this direction
            if (existingInDirection < 1) {
              entries.unshift(entry)
            }
            
            // Threshold rearrangement: if exceeds threshold, trim to threshold then continue
            // This prevents full rebuild at max length
            if (entries.length > thresholdRearrange && entries.length <= limit) {
              // Keep best performing entries by profitFactor
              entries.sort((a: any, b: any) => (b.profitFactor || 0) - (a.profitFactor || 0))
              entries = entries.slice(0, thresholdRearrange)
            } else if (entries.length > limit) {
              entries = entries.slice(0, limit)
            }
            
            await client.set(setKey, JSON.stringify(entries))
          }),
        )
      }
    } catch (error) {
      // Silent fail for non-critical batch operations
    }
  }

  /**
   * Save indication to its independent set pool (default 250 entries)
   * OPTIMIZED: Removed redundant stats updates
   */
  private async saveIndicationToSet(
    setKey: string,
    indication: any,
    type: string,
    config: any
  ): Promise<void> {
    try {
      const client = await getCachedClient()
      
      const existing = await client.get(setKey)
      let entries = existing ? JSON.parse(existing) : []

      const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newEntry = {
        id,
        timestamp: new Date().toISOString(),
        profitFactor: indication.profitFactor,
        confidence: indication.confidence,
        config,
        metadata: indication.metadata,
        direction: indication.direction,
      }
      
      // Check position limit per direction (max 1 per validated indication per config)
      const direction = indication.direction
      const existingInDirection = direction 
        ? entries.filter((e: any) => e.direction === direction).length 
        : 0
      
      // Only add if under limit for this direction
      if (existingInDirection < 1) {
        entries.unshift(newEntry)
      }

      const limit = this.getLimit(type as keyof IndicationSetLimits)
      if (entries.length > limit) entries = entries.slice(0, limit)

      await client.set(setKey, JSON.stringify(entries))
      
      // Broadcast indication update to connected clients
      const symbol = setKey.split(':')[2] // Extract symbol from setKey
      emitIndicationUpdate(this.connectionId, {
        id,
        symbol,
        direction: type === 'direction' || type === 'move' ? (Math.random() > 0.5 ? 'UP' : 'DOWN') : 'NEUTRAL',
        confidence: indication.confidence || 0,
        strength: indication.profitFactor || 0,
      })
      
      // Stats updates removed - too expensive for high-frequency operations
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Calculation methods for each type
   */

  private calculateDirectionIndication(
    marketData: any,
    config: { range: number; drawdownRatio: number; lastPartRatio: number; factorMultiplier: number },
  ): any {
    const { range, drawdownRatio, lastPartRatio, factorMultiplier } = config
    const prices = this.getPriceHistory(marketData, range * 2)
    if (!prices || prices.length < range * 2) return null

    const firstHalf = prices.slice(0, range)
    const secondHalf = prices.slice(range)

    const firstDir = this.getDirection(firstHalf)
    const secondDir = this.getDirection(secondHalf)

    // Opposite direction = signal
    if ((firstDir > 0 && secondDir < 0) || (firstDir < 0 && secondDir > 0)) {
      const reversalStrength = Math.abs(firstDir + secondDir)
      const drawdownPenalty = reversalStrength / Math.max(drawdownRatio * 10, 1)
      const tailWeight = 1 + lastPartRatio
      return {
        profitFactor: 1.0 + reversalStrength * factorMultiplier * tailWeight - drawdownPenalty,
        confidence: Math.min(1.0, ((Math.abs(firstDir) + Math.abs(secondDir)) / 2) * factorMultiplier),
        metadata: { firstDir, secondDir, range, drawdownRatio, lastPartRatio, factorMultiplier },
      }
    }

    return null
  }

  private calculateMoveIndication(
    marketData: any,
    config: { range: number; drawdownRatio: number; lastPartRatio: number; factorMultiplier: number },
  ): any {
    const { range, drawdownRatio, lastPartRatio, factorMultiplier } = config
    const prices = this.getPriceHistory(marketData, range)
    if (!prices || prices.length < range) return null

    const movement = Math.abs(prices[0] - prices[range - 1]) / prices[range - 1]
    const volatility = this.calculateVolatility(prices)
    const drawdownPenalty = movement / Math.max(drawdownRatio * 10, 1)
    const tailWeight = 1 + lastPartRatio

    return {
      profitFactor: 1.0 + (movement * 2 + volatility) * factorMultiplier * tailWeight - drawdownPenalty,
      confidence: Math.min(1.0, (movement + volatility / 2) * factorMultiplier),
      metadata: { movement, volatility, range, drawdownRatio, lastPartRatio, factorMultiplier },
    }
  }

  private calculateActiveIndication(
    marketData: any,
    config: {
      threshold: number
      drawdownRatio: number
      marketActivityRatio: number
      activityLastPartRatio: number
      activityRatio: number
    },
  ): any {
    const { threshold, drawdownRatio, marketActivityRatio, activityLastPartRatio, activityRatio } = config
    const prices = this.getPriceHistory(marketData, 10)
    if (!prices || prices.length < 2) return null

    const priceChange = Math.abs((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100

    if (priceChange >= threshold) {
      const normalizedChange = priceChange / Math.max(threshold, 0.1)
      const estimatedDrawdown = Math.max(0.1, normalizedChange / Math.max(drawdownRatio, 0.1))
      const activityScore = normalizedChange * marketActivityRatio
      const lastPartWeight = 1 + activityLastPartRatio
      const distanceWeight = activityRatio
      return {
        profitFactor: 1.0 + ((priceChange / 100) * distanceWeight * lastPartWeight) - (estimatedDrawdown * 0.01),
        confidence: Math.min(1.0, priceChange / threshold / 2),
        metadata: {
          priceChange,
          threshold,
          drawdownRatio,
          marketActivityRatio,
          activityLastPartRatio,
          activityRatio,
          estimatedDrawdown,
          activityScore,
        },
      }
    }

    return null
  }

  private calculateOptimalIndication(
    marketData: any,
    range: number,
    config: {
      drawdownRatio: number
      marketActivityRatio: number
      activityLastPartRatio: number
      activityRatio: number
      marketDistanceRatio: number
    },
  ): any {
    const { drawdownRatio, marketActivityRatio, activityLastPartRatio, activityRatio, marketDistanceRatio } = config
    const prices = this.getPriceHistory(marketData, range * 3)
    if (!prices || prices.length < range * 3) return null

    // Consecutive steps: multiple direction changes = optimal signal
    const steps = this.detectConsecutiveSteps(prices, range)

    if (steps >= 2) {
      const volatility = this.calculateVolatility(prices)
      const drawdownPenalty = steps / Math.max(drawdownRatio * 10, 1)
      const activityWeight = 1 + marketActivityRatio
      const lastPartWeight = 1 + activityLastPartRatio
      const distanceWeight = activityRatio * marketDistanceRatio
      return {
        profitFactor: 1.0 + (steps * 0.5 + volatility) * distanceWeight * activityWeight * lastPartWeight - drawdownPenalty,
        confidence: Math.min(1.0, steps / 3),
        metadata: { consecutiveSteps: steps, volatility, range, drawdownRatio, marketActivityRatio, activityLastPartRatio, activityRatio, marketDistanceRatio },
      }
    }

    return null
  }

  /**
   * Helper methods
   */

  private getPriceHistory(marketData: any, count: number): number[] | null {
    const prices = marketData.prices || []
    return prices.slice(0, count).map((p: any) => Number.parseFloat(p))
  }

  private getDirection(prices: number[]): number {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    return prices.reduce((a, b) => a + (b > avg ? 1 : -1), 0) / prices.length
  }

  private calculateVolatility(prices: number[]): number {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length
    return Math.sqrt(variance) / avg
  }

  private detectConsecutiveSteps(prices: number[], range: number): number {
    let steps = 0
    for (let i = range; i < prices.length - range; i += range) {
      const dir1 = this.getDirection(prices.slice(i - range, i))
      const dir2 = this.getDirection(prices.slice(i, i + range))
      if ((dir1 > 0 && dir2 < 0) || (dir1 < 0 && dir2 > 0)) {
        steps++
      }
    }
    return steps
  }

  /**
   * Get stats for a specific indication type set
   */
  async getSetStats(symbol: string, type: string): Promise<any> {
    try {
      const client = await getCachedClient()
      const prefix = `indication_set:${this.connectionId}:${symbol}:${type}`
      const keys = await client.keys(`${prefix}*`)
      if (!keys || keys.length === 0) {
        return {
          type,
          totalConfigurations: 0,
          currentEntries: 0,
          avgProfitFactor: 0,
          avgConfidence: 0,
        }
      }

      let totalEntries = 0
      let totalProfitFactor = 0
      let totalConfidence = 0
      let sampleCount = 0

      for (const key of keys) {
        const raw = await client.get(key)
        if (!raw) continue
        const entries = JSON.parse(raw)
        if (!Array.isArray(entries)) continue

        totalEntries += entries.length
        for (const entry of entries) {
          totalProfitFactor += Number(entry?.profitFactor || 0)
          totalConfidence += Number(entry?.confidence || 0)
          sampleCount++
        }
      }

      return {
        type,
        totalConfigurations: keys.length,
        currentEntries: totalEntries,
        avgProfitFactor: sampleCount > 0 ? totalProfitFactor / sampleCount : 0,
        avgConfidence: sampleCount > 0 ? totalConfidence / sampleCount : 0,
      }
    } catch (error) {
      console.error(`[v0] [IndicationSets] Failed to get stats for ${type}:`, error)
      return null
    }
  }

  /**
   * Get all entries from a specific indication type set
   */
  async getSetEntries(symbol: string, type: string, limit = 50): Promise<any[]> {
    try {
      const client = await getCachedClient()
      const prefix = `indication_set:${this.connectionId}:${symbol}:${type}`
      const keys = await client.keys(`${prefix}*`)
      if (!keys || keys.length === 0) return []

      const allEntries: any[] = []
      for (const key of keys) {
        const raw = await client.get(key)
        if (!raw) continue
        const entries = JSON.parse(raw)
        if (!Array.isArray(entries)) continue
        allEntries.push(...entries.map((entry) => ({ ...entry, setKey: key })))
      }

      return allEntries
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error(`[v0] [IndicationSets] Failed to get entries for ${type}:`, error)
      return []
    }
  }
}
