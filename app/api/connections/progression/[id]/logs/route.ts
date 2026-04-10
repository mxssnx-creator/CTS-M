import { type NextRequest, NextResponse } from "next/server"
import { getProgressionLogs, clearProgressionLogs } from "@/lib/engine-progression-logs"
import { initRedis, getRedisClient, getSettings } from "@/lib/redis-db"
import { ProgressionStateManager } from "@/lib/progression-state-manager"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function sanitizeNonNegative(value: unknown): number {
  return Math.max(0, toNumber(value))
}

function parseBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value
  const normalized = String(value ?? "").toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "running"
}

async function countKeys(client: any, patterns: string[]): Promise<number> {
  let total = 0
  for (const pattern of patterns) {
    const keys = await client.keys(pattern).catch(() => [])
    total += Array.isArray(keys) ? keys.length : 0
  }
  return total
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    
    await initRedis()

    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID required" }, { status: 400 })
    }

    // Get progression logs for this connection
    const logs = await getProgressionLogs(connectionId)
    
    // Get progression state (cycles, trades, etc.)
    const progressionState = await ProgressionStateManager.getProgressionState(connectionId)
    const engineState = await getSettings(`trade_engine_state:${connectionId}`)
    
    // Get engine progression phase
    const engineProgression = await getSettings(`engine_progression:${connectionId}`)
    
    // Get structured engine logs
    const client = getRedisClient()
    let structuredLogs: any[] = []
    try {
      const rawLogs = await client.lrange(`engine:logs:${connectionId}`, 0, 100)
      structuredLogs = rawLogs.map((log: string) => {
        try { return JSON.parse(log) } catch { return null }
      }).filter(Boolean)
    } catch {
      structuredLogs = []
    }

    const mergedLogs = logs.length > 0
      ? logs
      : structuredLogs.map((log: any) => ({
          timestamp: log.timestamp || new Date().toISOString(),
          level: log.status === "error" ? "error" : "info",
          phase: log.phase || log.engine || "engine",
          message: log.action || "structured log",
          details: log.details || {},
          connectionId,
        }))

    const [
      prehistoricSymbolsSet,
      prehistoricDataKeys,
      baseSetCount,
      mainSetCount,
      realSetCount,
      indicationDirectionCount,
      indicationMoveCount,
      indicationActiveCount,
      indicationOptimalCount,
      redisDbSize,
      redisMemoryInfo,
    ] = await Promise.all([
      client.scard(`prehistoric:${connectionId}:symbols`).catch(() => 0),
      countKeys(client, [`prehistoric:${connectionId}:*`, `market_data:${connectionId}:*`]),
      countKeys(client, [`sets:${connectionId}:base:*`, `pseudo_positions:${connectionId}:base:*`]),
      countKeys(client, [`sets:${connectionId}:main:*`, `pseudo_positions:${connectionId}:main:*`]),
      countKeys(client, [`sets:${connectionId}:real:*`, `pseudo_positions:${connectionId}:real:*`]),
      toNumber(await client.get(`indications:${connectionId}:direction:evaluated`).catch(() => 0)),
      toNumber(await client.get(`indications:${connectionId}:move:evaluated`).catch(() => 0)),
      toNumber(await client.get(`indications:${connectionId}:active:evaluated`).catch(() => 0)),
      toNumber(await client.get(`indications:${connectionId}:optimal:evaluated`).catch(() => 0)),
      client.dbSize().catch(() => 0),
      client.info().catch(() => ""),
    ])

    const progressionPrehistoricSymbols = Array.isArray(progressionState.prehistoricSymbolsProcessed)
      ? progressionState.prehistoricSymbolsProcessed.length
      : 0
    const effectiveCyclesCompleted = sanitizeNonNegative(
      Math.max(
        progressionState.cyclesCompleted,
        toNumber(engineState?.indication_cycle_count),
        toNumber(engineState?.strategy_cycle_count),
        toNumber(engineState?.realtime_cycle_count),
      )
    )
    const effectiveSuccessfulCycles = sanitizeNonNegative(
      Math.max(
        progressionState.successfulCycles,
        toNumber(engineState?.successful_cycles),
        toNumber(engineState?.strategy_cycle_count),
      )
    )
    const effectiveFailedCycles = sanitizeNonNegative(
      Math.max(progressionState.failedCycles, toNumber(engineState?.failed_cycles))
    )
    const derivedCycleSuccessRate = effectiveCyclesCompleted > 0
      ? (effectiveSuccessfulCycles / effectiveCyclesCompleted) * 100
      : 0
    const effectivePrehistoricCycles = sanitizeNonNegative(
      Math.max(progressionState.prehistoricCyclesCompleted || 0, toNumber(engineState?.prehistoric_cycles_completed))
    )
    const effectivePrehistoricSymbols = sanitizeNonNegative(
      Math.max(
        prehistoricSymbolsSet,
        progressionState.prehistoricSymbolsProcessedCount || 0,
        progressionPrehistoricSymbols,
        toNumber(engineState?.config_set_symbols_processed),
      )
    )
    const effectivePrehistoricCandles = sanitizeNonNegative(
      Math.max(progressionState.prehistoricCandlesProcessed || 0, toNumber(engineState?.config_set_candles_processed))
    )
    const effectiveDirection = sanitizeNonNegative(
      Math.max(indicationDirectionCount, progressionState.indicationsDirectionCount || 0)
    )
    const effectiveMove = sanitizeNonNegative(
      Math.max(indicationMoveCount, progressionState.indicationsMoveCount || 0)
    )
    const effectiveActive = sanitizeNonNegative(
      Math.max(indicationActiveCount, progressionState.indicationsActiveCount || 0)
    )
    const effectiveOptimal = sanitizeNonNegative(
      Math.max(indicationOptimalCount, progressionState.indicationsOptimalCount || 0)
    )
    const effectiveIndicationsCount = sanitizeNonNegative(
      Math.max(
        progressionState.indicationsCount || 0,
        effectiveDirection + effectiveMove + effectiveActive + effectiveOptimal,
        toNumber(engineState?.indications_count),
      )
    )
    const effectiveStrategyBase = sanitizeNonNegative(
      Math.max(baseSetCount, progressionState.strategiesBaseTotal || 0, toNumber(engineState?.strategies_base_total))
    )
    const effectiveStrategyMain = sanitizeNonNegative(
      Math.max(mainSetCount, progressionState.strategiesMainTotal || 0, toNumber(engineState?.strategies_main_total))
    )
    const effectiveStrategyReal = sanitizeNonNegative(
      Math.max(realSetCount, progressionState.strategiesRealTotal || 0, toNumber(engineState?.strategies_real_total))
    )
    const effectiveStrategiesCount = sanitizeNonNegative(
      Math.max(
        progressionState.strategiesCount || 0,
        effectiveStrategyBase + effectiveStrategyMain + effectiveStrategyReal,
        toNumber(engineState?.strategies_count),
      )
    )

    const usedMemoryLine = String(redisMemoryInfo)
      .split("\n")
      .find((line) => line.startsWith("used_memory:"))
    const usedMemoryBytes = toNumber(usedMemoryLine?.split(":")[1])
    const dbSizeMb = usedMemoryBytes > 0 ? usedMemoryBytes / (1024 * 1024) : 0

    return NextResponse.json({
      success: true,
      connectionId,
      logsCount: mergedLogs.length,
      logs: mergedLogs,
      structuredLogs,
      structuredLogsCount: structuredLogs.length,
      progressionState: {
        cyclesCompleted: effectiveCyclesCompleted,
        successfulCycles: effectiveSuccessfulCycles,
        failedCycles: effectiveFailedCycles,
        totalTrades: sanitizeNonNegative(progressionState.totalTrades),
        successfulTrades: sanitizeNonNegative(progressionState.successfulTrades),
        totalProfit: toNumber(progressionState.totalProfit),
        cycleSuccessRate: sanitizeNonNegative(Math.max(progressionState.cycleSuccessRate, derivedCycleSuccessRate)),
        tradeSuccessRate: sanitizeNonNegative(progressionState.tradeSuccessRate),
        lastCycleTime: progressionState.lastCycleTime,
        prehistoricCyclesCompleted: effectivePrehistoricCycles,
        prehistoricPhaseActive: parseBooleanFlag(progressionState.prehistoricPhaseActive) || parseBooleanFlag(engineState?.prehistoric_phase_active),
        realtimeCycleCount: sanitizeNonNegative(engineState?.realtime_cycle_count),
        cycleTimeMs: sanitizeNonNegative(Math.max(progressionState.cycleTimeMs || 0, toNumber(engineState?.last_cycle_duration))),
        intervalsProcessed: sanitizeNonNegative(await client.get(`intervals:${connectionId}:processed_count`).catch(() => 0)),
        indicationsCount: effectiveIndicationsCount,
        strategiesCount: effectiveStrategiesCount,
        strategyEvaluatedBase: sanitizeNonNegative(Math.max(progressionState.strategyEvaluatedBase || 0, toNumber(await client.get(`strategies:${connectionId}:base:evaluated`).catch(() => 0)))),
        strategyEvaluatedMain: sanitizeNonNegative(Math.max(progressionState.strategyEvaluatedMain || 0, toNumber(await client.get(`strategies:${connectionId}:main:evaluated`).catch(() => 0)))),
        strategyEvaluatedReal: sanitizeNonNegative(Math.max(progressionState.strategyEvaluatedReal || 0, toNumber(await client.get(`strategies:${connectionId}:real:evaluated`).catch(() => 0)))),
        indicationEvaluatedDirection: effectiveDirection,
        indicationEvaluatedMove: effectiveMove,
        indicationEvaluatedActive: effectiveActive,
        indicationEvaluatedOptimal: effectiveOptimal,
        prehistoricSymbolsProcessed: effectivePrehistoricSymbols,
        prehistoricCandlesProcessed: effectivePrehistoricCandles,
        prehistoricSymbolsProcessedCount: effectivePrehistoricSymbols,
        prehistoricDataSize: sanitizeNonNegative(prehistoricDataKeys),
        setsBaseCount: effectiveStrategyBase,
        setsMainCount: effectiveStrategyMain,
        setsRealCount: effectiveStrategyReal,
        setsTotalCount: sanitizeNonNegative(effectiveStrategyBase + effectiveStrategyMain + effectiveStrategyReal),
        redisDbEntries: sanitizeNonNegative(redisDbSize),
        redisDbSizeMb: Number(dbSizeMb.toFixed(2)),
        processingCompleteness: {
          prehistoricLoaded: parseBooleanFlag(engineState?.prehistoric_data_loaded) || effectivePrehistoricCycles > 0 || effectivePrehistoricSymbols > 0 || effectivePrehistoricCandles > 0,
          indicationsRunning: sanitizeNonNegative(engineState?.indication_cycle_count) > 0 || effectiveIndicationsCount > 0,
          strategiesRunning: sanitizeNonNegative(engineState?.strategy_cycle_count) > 0 || effectiveStrategiesCount > 0,
          realtimeRunning: sanitizeNonNegative(engineState?.realtime_cycle_count) > 0 || effectiveCyclesCompleted > 0,
          hasErrors: sanitizeNonNegative(engineState?.config_set_errors) > 0,
        },
      },
      enginePhase: engineProgression ? {
        phase: engineProgression.phase,
        progress: engineProgression.progress,
        detail: engineProgression.detail,
        updatedAt: engineProgression.updated_at,
      } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error fetching progression logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch progression logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    
    await initRedis()

    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID required" }, { status: 400 })
    }

    // Clear progression logs
    await clearProgressionLogs(connectionId)
    
    // Also clear structured logs
    const client = getRedisClient()
    await client.del(`engine:logs:${connectionId}`)
    await client.del(`engine_logs:${connectionId}`)

    return NextResponse.json({
      success: true,
      message: "Logs cleared successfully",
      connectionId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error clearing progression logs:", error)
    return NextResponse.json(
      { error: "Failed to clear logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
