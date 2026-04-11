import { getConnectionInsights } from "@/lib/connection-insights"

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

export async function getConnectionObservability(connectionId: string) {
  const insights = await getConnectionInsights(connectionId)
  const progression = insights.tracking.progression

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

  const prehistoric = {
    loaded: insights.engine.prehistoricLoaded,
    symbols: Math.max(
      toNumber((insights.engineState as any)?.config_set_symbols_processed),
      toNumber((insights.engineState as any)?.prehistoric_symbols?.length),
    ),
    candlesProcessed: toNumber((insights.engineState as any)?.config_set_candles_processed),
    indicationResults: toNumber((insights.engineState as any)?.config_set_indication_results),
    strategyPositions: toNumber((insights.engineState as any)?.config_set_strategy_positions),
    errors: toNumber((insights.engineState as any)?.config_set_errors),
    lastProcessedAt: (insights.engineState as any)?.prehistoric_last_processed_at || null,
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
