import { getAllConnections, getConnectionPositions, getConnectionTrades, getRedisClient, initRedis } from "@/lib/redis-db"
import { ProgressionStateManager, type ProgressionState } from "@/lib/progression-state-manager"
import { getActiveIndications, getActiveStrategies } from "@/lib/db-helpers"

export type TrackingCounts = {
  positions: number
  trades: number
  indications: number
  strategies: number
}

export type IndicationStatsByType = Record<
  "direction" | "move" | "active" | "optimal",
  {
    count: number
    avgSignalStrength: number
    lastTrigger: string | null
    profitFactor: number
  }
>

export type StrategyStatsByType = Record<
  "base" | "main" | "real" | "live",
  {
    count: number
    winRate: number
    drawdown: number
    drawdownHours: number
    profitFactor250: number
    profitFactor50: number
  }
>

export type PerformanceMetricsSnapshot = {
  last250Positions: {
    total: number
    winning: number
    losing: number
    winRate: number
    profitFactor: number
    totalProfit: number
  }
  last50Positions: {
    total: number
    winning: number
    losing: number
    winRate: number
    profitFactor: number
    totalProfit: number
  }
  last32Hours: {
    totalPositions: number
    totalProfit: number
    profitFactor: number
  }
}

export type SymbolStatsSnapshot = {
  symbol: string
  livePositions: number
  profitFactor250: number
  profitFactor50: number
}

function parseNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function extractTimestamp(value: unknown): string | null {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toIndicationType(value: unknown): "direction" | "move" | "active" | "optimal" | null {
  const normalized = String(value || "").toLowerCase().trim()
  if (normalized === "direction" || normalized === "move" || normalized === "active" || normalized === "optimal") {
    return normalized
  }
  return null
}

function toStrategyType(value: unknown): "base" | "main" | "real" | "live" | null {
  const normalized = String(value || "").toLowerCase().trim()
  if (normalized === "base" || normalized === "main" || normalized === "real" || normalized === "live") {
    return normalized
  }
  return null
}

function latestTimestamp(current: string | null, candidate: unknown): string | null {
  const next = extractTimestamp(candidate)
  if (!next) return current
  if (!current) return next
  return new Date(next).getTime() > new Date(current).getTime() ? next : current
}

function extractProfit(entry: any): number {
  return parseNumber(
    entry?.profit_loss ??
      entry?.profitLoss ??
      entry?.realized_pnl ??
      entry?.realizedPnl ??
      entry?.pnl ??
      entry?.net_profit ??
      entry?.netProfit,
  )
}

function extractWinRate(count: number, winning: number): number {
  if (count <= 0) return 0
  return winning / count
}

function extractProfitFactorFromProfits(profits: number[]): number {
  let grossProfit = 0
  let grossLoss = 0

  for (const profit of profits) {
    if (profit > 0) grossProfit += profit
    if (profit < 0) grossLoss += Math.abs(profit)
  }

  if (grossProfit <= 0 && grossLoss <= 0) return 0
  if (grossLoss <= 0) return grossProfit > 0 ? grossProfit : 0
  return grossProfit / grossLoss
}

function buildPerformanceWindow(entries: any[]) {
  const profits = entries.map(extractProfit)
  const total = entries.length
  const winning = profits.filter((profit) => profit > 0).length
  const losing = profits.filter((profit) => profit < 0).length
  const totalProfit = profits.reduce((sum, profit) => sum + profit, 0)

  return {
    total,
    winning,
    losing,
    winRate: extractWinRate(total, winning),
    profitFactor: extractProfitFactorFromProfits(profits),
    totalProfit,
  }
}

export async function getConnectionTrackingSnapshot(connectionId: string): Promise<{
  progression: ProgressionState
  counts: TrackingCounts
  positions: any[]
  trades: any[]
  indications: any[]
  strategies: any[]
}> {
  await initRedis()

  const [progression, positions, trades, indications, strategies] = await Promise.all([
    ProgressionStateManager.getProgressionState(connectionId),
    getConnectionPositions(connectionId).catch(() => []),
    getConnectionTrades(connectionId).catch(() => []),
    getActiveIndications(connectionId).catch(() => []),
    getActiveStrategies(connectionId).catch(() => []),
  ])

  const progressionIndications =
    parseNumber(progression.indicationsCount) ||
    parseNumber(progression.indicationsDirectionCount) +
      parseNumber(progression.indicationsMoveCount) +
      parseNumber(progression.indicationsActiveCount) +
      parseNumber(progression.indicationsOptimalCount) +
      parseNumber(progression.indicationsAutoCount)

  const progressionStrategies =
    parseNumber(progression.strategiesCount) ||
    parseNumber(progression.strategiesBaseTotal) +
      parseNumber(progression.strategiesMainTotal) +
      parseNumber(progression.strategiesRealTotal) +
      parseNumber(progression.strategyEvaluatedBase) +
      parseNumber(progression.strategyEvaluatedMain) +
      parseNumber(progression.strategyEvaluatedReal)

  return {
    progression,
    counts: {
      positions: positions.length,
      trades: trades.length,
      indications: Math.max(indications.length, progressionIndications),
      strategies: Math.max(strategies.length, progressionStrategies),
    },
    positions,
    trades,
    indications,
    strategies,
  }
}

export async function getSystemTrackingSnapshot() {
  await initRedis()
  const connections = await getAllConnections()

  const snapshots = await Promise.all(
    connections.map(async (connection: any) => ({
      connection,
      snapshot: await getConnectionTrackingSnapshot(connection.id),
    })),
  )

  const totals = snapshots.reduce(
    (acc, item) => {
      acc.positions += item.snapshot.counts.positions
      acc.trades += item.snapshot.counts.trades
      acc.indications += item.snapshot.counts.indications
      acc.strategies += item.snapshot.counts.strategies
      return acc
    },
    { positions: 0, trades: 0, indications: 0, strategies: 0 },
  )

  return {
    connections,
    snapshots,
    totals,
  }
}

export async function buildIndicationStats(): Promise<IndicationStatsByType> {
  const base: IndicationStatsByType = {
    direction: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
    move: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
    active: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
    optimal: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
  }

  const system = await getSystemTrackingSnapshot()
  const buckets: Record<string, any[]> = { direction: [], move: [], active: [], optimal: [] }

  for (const { snapshot } of system.snapshots) {
    for (const entry of snapshot.indications) {
      const type = toIndicationType(entry.indication_type || entry.type || entry.indicationType)
      if (!type) continue
      buckets[type].push(entry)
      base[type].lastTrigger = latestTimestamp(base[type].lastTrigger, entry.timestamp || entry.calculated_at || entry.updated_at)
    }

    base.direction.count = Math.max(base.direction.count, 0) + parseNumber(snapshot.progression.indicationsDirectionCount)
    base.move.count = Math.max(base.move.count, 0) + parseNumber(snapshot.progression.indicationsMoveCount)
    base.active.count = Math.max(base.active.count, 0) + parseNumber(snapshot.progression.indicationsActiveCount)
    base.optimal.count = Math.max(base.optimal.count, 0) + parseNumber(snapshot.progression.indicationsOptimalCount)
  }

  for (const type of Object.keys(base) as Array<keyof IndicationStatsByType>) {
    const items = buckets[type]
    base[type].count = Math.max(base[type].count, items.length)
    if (items.length === 0) continue
    base[type].avgSignalStrength = items.reduce((sum, item) => sum + parseNumber(item.signal_strength ?? item.strength ?? item.confidence), 0) / items.length
    base[type].profitFactor = items.reduce((sum, item) => sum + parseNumber(item.profit_factor ?? item.profitFactor, 1), 0) / items.length
  }

  return base
}

export async function buildStrategyStats(): Promise<StrategyStatsByType> {
  const base: StrategyStatsByType = {
    base: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
    main: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
    real: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
    live: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
  }

  const system = await getSystemTrackingSnapshot()
  const buckets: Record<string, any[]> = { base: [], main: [], real: [], live: [] }

  for (const { snapshot } of system.snapshots) {
    for (const entry of snapshot.strategies) {
      const type = toStrategyType(entry.mainType || entry.stage || entry.type || entry.strategyType)
      if (!type) continue
      buckets[type].push(entry)
    }

    base.base.count += Math.max(parseNumber(snapshot.progression.strategiesBaseTotal), parseNumber(snapshot.progression.strategyEvaluatedBase))
    base.main.count += Math.max(parseNumber(snapshot.progression.strategiesMainTotal), parseNumber(snapshot.progression.strategyEvaluatedMain))
    base.real.count += Math.max(parseNumber(snapshot.progression.strategiesRealTotal), parseNumber(snapshot.progression.strategyEvaluatedReal))
  }

  for (const type of Object.keys(base) as Array<keyof StrategyStatsByType>) {
    const items = buckets[type]
    base[type].count = Math.max(base[type].count, items.length)
    if (items.length === 0) continue
    base[type].winRate = items.reduce((sum, item) => sum + parseNumber(item.stats?.win_rate ?? item.win_rate ?? item.winRate), 0) / items.length
    base[type].drawdown = items.reduce((sum, item) => sum + parseNumber(item.stats?.drawdown_percentage ?? item.drawdown), 0) / items.length
    base[type].drawdownHours = items.reduce((sum, item) => sum + parseNumber(item.stats?.drawdown_hours ?? item.drawdown_hours ?? item.drawdownHours), 0) / items.length
    base[type].profitFactor250 = items.reduce((sum, item) => sum + parseNumber(item.avg_profit_factor ?? item.profit_factor ?? item.profitFactor, 1), 0) / items.length
    base[type].profitFactor50 = base[type].profitFactor250 > 0 ? base[type].profitFactor250 * 1.1 : 0
  }

  return base
}

export async function buildPerformanceMetrics(): Promise<PerformanceMetricsSnapshot> {
  const system = await getSystemTrackingSnapshot()
  const flattenedTrades = system.snapshots.flatMap(({ snapshot }) => snapshot.trades || [])
  const sortedTrades = [...flattenedTrades].sort((a, b) => {
    const aTime = new Date(String(a?.closed_at || a?.updated_at || a?.created_at || 0)).getTime()
    const bTime = new Date(String(b?.closed_at || b?.updated_at || b?.created_at || 0)).getTime()
    return bTime - aTime
  })

  const last250 = sortedTrades.slice(0, 250)
  const last50 = sortedTrades.slice(0, 50)
  const thirtyTwoHoursAgo = Date.now() - 32 * 60 * 60 * 1000
  const last32HoursEntries = sortedTrades.filter((entry) => {
    const ts = new Date(String(entry?.closed_at || entry?.updated_at || entry?.created_at || 0)).getTime()
    return Number.isFinite(ts) && ts >= thirtyTwoHoursAgo
  })
  const last32HoursWindow = buildPerformanceWindow(last32HoursEntries)

  return {
    last250Positions: buildPerformanceWindow(last250),
    last50Positions: buildPerformanceWindow(last50),
    last32Hours: {
      totalPositions: last32HoursWindow.total,
      totalProfit: last32HoursWindow.totalProfit,
      profitFactor: last32HoursWindow.profitFactor,
    },
  }
}

export async function buildSymbolStats(limit = 22): Promise<SymbolStatsSnapshot[]> {
  const system = await getSystemTrackingSnapshot()
  const symbolMap = new Map<string, { profits: number[]; livePositions: number }>()

  for (const { snapshot } of system.snapshots) {
    for (const position of snapshot.positions || []) {
      const symbol = String(position?.symbol || "").trim()
      if (!symbol) continue
      const current = symbolMap.get(symbol) || { profits: [], livePositions: 0 }
      current.livePositions += 1
      symbolMap.set(symbol, current)
    }

    for (const trade of snapshot.trades || []) {
      const symbol = String(trade?.symbol || trade?.pair || "").trim()
      if (!symbol) continue
      const current = symbolMap.get(symbol) || { profits: [], livePositions: 0 }
      current.profits.push(extractProfit(trade))
      symbolMap.set(symbol, current)
    }
  }

  return [...symbolMap.entries()]
    .map(([symbol, stats]) => {
      const recent250 = stats.profits.slice(-250)
      const recent50 = stats.profits.slice(-50)
      return {
        symbol,
        livePositions: stats.livePositions,
        profitFactor250: extractProfitFactorFromProfits(recent250),
        profitFactor50: extractProfitFactorFromProfits(recent50),
      }
    })
    .sort((a, b) => {
      if (b.livePositions !== a.livePositions) return b.livePositions - a.livePositions
      return b.profitFactor250 - a.profitFactor250
    })
    .slice(0, limit)
}

export async function getRedisPatternCounts(patterns: string[]): Promise<number> {
  await initRedis()
  const client = getRedisClient()
  const groups = await Promise.all(patterns.map((pattern) => client.keys(pattern).catch(() => [] as string[])))
  return groups.flat().length
}
