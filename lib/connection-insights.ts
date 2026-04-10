import { getConnectionTrackingSnapshot } from "@/lib/dashboard-tracking"
import { getConnectionPositions, getConnectionTrades, getRedisClient, initRedis, getSettings } from "@/lib/redis-db"

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  const normalized = String(value ?? "").toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "running"
}

export async function getConnectionInsights(connectionId: string) {
  await initRedis()

  const client = getRedisClient()
  const tracking = await getConnectionTrackingSnapshot(connectionId)
  const [engineState, structuredLogEntries, positions, trades] = await Promise.all([
    getSettings(`trade_engine_state:${connectionId}`),
    client.lrange(`engine:logs:${connectionId}`, 0, 199).catch(() => [] as string[]),
    getConnectionPositions(connectionId).catch(() => []),
    getConnectionTrades(connectionId).catch(() => []),
  ])

  const structuredLogs = structuredLogEntries
    .map((entry) => {
      try {
        return JSON.parse(entry)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const activeSymbols = Array.isArray((engineState as any)?.symbols)
    ? (engineState as any).symbols
    : Array.isArray((engineState as any)?.active_symbols)
      ? (engineState as any).active_symbols
      : []

  const indicationsByType = {
    direction: tracking.progression.indicationsDirectionCount || 0,
    move: tracking.progression.indicationsMoveCount || 0,
    active: tracking.progression.indicationsActiveCount || 0,
    optimal: tracking.progression.indicationsOptimalCount || 0,
    auto: tracking.progression.indicationsAutoCount || 0,
  }

  const strategyCounts = {
    base: tracking.progression.strategiesBaseTotal || 0,
    main: tracking.progression.strategiesMainTotal || 0,
    real: tracking.progression.strategiesRealTotal || 0,
  }

  const strategyEvaluated = {
    base: tracking.progression.strategyEvaluatedBase || 0,
    main: tracking.progression.strategyEvaluatedMain || 0,
    real: tracking.progression.strategyEvaluatedReal || 0,
  }

  const logLevels = structuredLogs.reduce(
    (acc: Record<string, number>, log: any) => {
      const level = String(log?.status || log?.level || "info").toLowerCase()
      acc[level] = (acc[level] || 0) + 1
      return acc
    },
    { info: 0, warning: 0, error: 0, debug: 0 },
  )

  return {
    tracking,
    engineState,
    structuredLogs,
    positions,
    trades,
    activeSymbols,
    indicationsByType,
    strategyCounts,
    strategyEvaluated,
    counts: {
      positions: positions.length,
      trades: trades.length,
      indications: tracking.counts.indications,
      strategies: tracking.counts.strategies,
      logs: structuredLogs.length,
    },
    engine: {
      status: String((engineState as any)?.status || "stopped"),
      indicationCycles: toNumber((engineState as any)?.indication_cycle_count) || tracking.progression.cyclesCompleted,
      strategyCycles: toNumber((engineState as any)?.strategy_cycle_count) || tracking.progression.successfulCycles,
      realtimeCycles: toNumber((engineState as any)?.realtime_cycle_count),
      indicationAvgDuration: toNumber((engineState as any)?.indication_avg_duration_ms),
      strategyAvgDuration: toNumber((engineState as any)?.strategy_avg_duration_ms),
      realtimeAvgDuration: toNumber((engineState as any)?.realtime_avg_duration_ms),
      lastCycleDuration: toNumber((engineState as any)?.last_cycle_duration) || tracking.progression.cycleTimeMs || 0,
      prehistoricLoaded: toBoolean((engineState as any)?.prehistoric_data_loaded) || Boolean(tracking.progression.prehistoricCyclesCompleted),
    },
    logLevels,
  }
}
