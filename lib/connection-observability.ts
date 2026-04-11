import { getConnectionInsights } from "@/lib/connection-insights"

const REALTIME_WINDOW_MS = 90_000

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toPercent(value: unknown): number {
  const numeric = toNumber(value)
  if (numeric <= 0) return 0
  if (numeric <= 1) return numeric * 100
  return numeric
}

function toTimestamp(value: unknown): number | null {
  if (!value) return null
  const timestamp = new Date(String(value)).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function countLogsByMatch(logs: any[], matcher: (log: any) => boolean) {
  return logs.reduce((sum, log) => sum + (matcher(log) ? 1 : 0), 0)
}

export async function getConnectionObservability(connectionId: string) {
  const insights = await getConnectionInsights(connectionId)
  const progression = insights.tracking.progression
  const engineState = (insights.engineState as any) || {}
  const now = Date.now()

  const indications = {
    direction: Math.max(insights.indicationsByType.direction, toNumber(progression.indicationsDirectionCount)),
    move: Math.max(insights.indicationsByType.move, toNumber(progression.indicationsMoveCount)),
    active: Math.max(insights.indicationsByType.active, toNumber(progression.indicationsActiveCount)),
    optimal: Math.max(insights.indicationsByType.optimal, toNumber(progression.indicationsOptimalCount)),
    auto: Math.max(insights.indicationsByType.auto, toNumber(progression.indicationsAutoCount)),
  }

  const indicationTotal = Object.values(indications).reduce((sum, value) => sum + value, 0)

  const strategies = {
    base: Math.max(insights.strategyCounts.base, insights.strategyEvaluated.base),
    main: Math.max(insights.strategyCounts.main, insights.strategyEvaluated.main),
    real: Math.max(insights.strategyCounts.real, insights.strategyEvaluated.real),
    live: Math.max(toNumber((insights.engineState as any)?.live_ready_count), insights.counts.positions),
  }

  const logs = {
    total: insights.counts.logs,
    info: insights.logLevels.info || 0,
    warning: insights.logLevels.warning || 0,
    error: insights.logLevels.error || 0,
    debug: insights.logLevels.debug || 0,
    latest: insights.structuredLogs[0] ?? null,
  }

  const historicLogCount = countLogsByMatch(
    insights.structuredLogs,
    (log) => /prehistoric|histor/i.test(String(log?.phase || log?.engine || log?.action || "")),
  )

  const realtimeLogCount = countLogsByMatch(
    insights.structuredLogs,
    (log) => /realtime|live|position/i.test(String(log?.phase || log?.engine || log?.action || "")),
  )

  const lastHistoricUpdate =
    engineState.prehistoric_last_processed_at ||
    engineState.prehistoric_data_end ||
    engineState.updated_at ||
    null

  const lastRealtimeUpdate =
    engineState.last_realtime_run ||
    engineState.last_indication_run ||
    engineState.last_strategy_run ||
    null

  const lastRealtimeTimestamp = toTimestamp(lastRealtimeUpdate)
  const lastHistoricTimestamp = toTimestamp(lastHistoricUpdate)

  const historicPhase = {
    isLoaded: insights.engine.prehistoricLoaded,
    isProcessing:
      !insights.engine.prehistoricLoaded &&
      (toNumber(engineState.config_set_symbols_processed) > 0 || historicLogCount > 0),
    hasErrors: toNumber(engineState.config_set_errors) > 0,
    symbolsTotal: Math.max(toNumber(engineState.config_set_symbols_total), toNumber(engineState.prehistoric_symbols?.length)),
    symbolsProcessed: Math.max(toNumber(engineState.config_set_symbols_processed), toNumber(engineState.prehistoric_symbols?.length)),
    symbolsWithoutData: toNumber(engineState.config_set_symbols_without_data),
    candlesProcessed: toNumber(engineState.config_set_candles_processed),
    indicationResults: toNumber(engineState.config_set_indication_results),
    strategyPositions: toNumber(engineState.config_set_strategy_positions),
    durationMs: toNumber(engineState.config_set_duration_ms),
    logs: historicLogCount,
    lastUpdatedAt: lastHistoricUpdate,
  }

  const realtimePhase = {
    isActive:
      insights.engine.status === "running" ||
      (lastRealtimeTimestamp !== null && now - lastRealtimeTimestamp <= REALTIME_WINDOW_MS) ||
      insights.engine.realtimeCycles > 0 ||
      insights.counts.positions > 0,
    isStale:
      lastRealtimeTimestamp !== null && now - lastRealtimeTimestamp > REALTIME_WINDOW_MS,
    cycles: {
      indications: insights.engine.indicationCycles,
      strategies: insights.engine.strategyCycles,
      realtime: insights.engine.realtimeCycles,
      total: insights.engine.indicationCycles + insights.engine.strategyCycles + insights.engine.realtimeCycles,
    },
    avgDurationMs: {
      indications: insights.engine.indicationAvgDuration,
      strategies: insights.engine.strategyAvgDuration,
      realtime: insights.engine.realtimeAvgDuration,
      last: insights.engine.lastCycleDuration,
    },
    activeSymbols: insights.activeSymbols.length,
    positions: insights.counts.positions,
    trades: insights.counts.trades,
    logs: realtimeLogCount,
    lastUpdatedAt: lastRealtimeUpdate,
  }

  const prehistoric = {
    loaded: historicPhase.isLoaded,
    symbols: Math.max(
      historicPhase.symbolsProcessed,
      historicPhase.symbolsTotal,
    ),
    candlesProcessed: historicPhase.candlesProcessed,
    indicationResults: historicPhase.indicationResults,
    strategyPositions: historicPhase.strategyPositions,
    errors: toNumber(engineState.config_set_errors),
    lastProcessedAt: historicPhase.lastUpdatedAt,
  }

  const cyclesCompleted = Math.max(insights.engine.indicationCycles, toNumber(progression.cyclesCompleted))
  const successfulCycles = Math.max(insights.engine.strategyCycles, toNumber(progression.successfulCycles))
  const failedCycles = toNumber(progression.failedCycles)

  return {
    connectionId,
    tracking: insights.tracking,
    engineState: insights.engineState,
    positions: insights.positions,
    trades: insights.trades,
    logs: insights.structuredLogs,
    counts: {
      positions: insights.counts.positions,
      trades: insights.counts.trades,
      indications: Math.max(insights.counts.indications, indicationTotal),
      strategies: Math.max(insights.counts.strategies, strategies.base + strategies.main + strategies.real),
      logs: logs.total,
    },
    engine: {
      ...insights.engine,
      activeSymbols: insights.activeSymbols.length,
      activeSymbolList: insights.activeSymbols,
    },
    phases: {
      historic: historicPhase,
      realtime: realtimePhase,
    },
    progression: {
      raw: progression,
      cyclesCompleted,
      successfulCycles,
      failedCycles,
      cycleSuccessRate: toPercent(progression.cycleSuccessRate),
      tradeSuccessRate: toPercent(progression.tradeSuccessRate),
      totalTrades: toNumber(progression.totalTrades),
      successfulTrades: toNumber(progression.successfulTrades),
      totalProfit: toNumber(progression.totalProfit),
      lastCycleTime: progression.lastCycleTime || null,
      updatedAt: (progression as any).updatedAt || null,
    },
    indications,
    strategies,
    prehistoric,
    logSummary: logs,
  }
}
