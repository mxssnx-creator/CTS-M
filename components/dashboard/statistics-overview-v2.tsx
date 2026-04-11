"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity, Zap, RefreshCw, AlertCircle } from "lucide-react"

interface StrategyMetrics {
  type: "base" | "main" | "real" | "live"
  count: number
  winRate: number
  drawdown: number
  drawdownHours: number
  profitFactor250: number
  profitFactor50: number
}

interface IndicationMetrics {
  type: "direction" | "move" | "active" | "optimal"
  totalCount: number
  avgSignalStrength: number
  lastTrigger: Date | null
  profitFactor: number
}

interface SymbolStats {
  symbol: string
  livePositions: number
  profitFactor250: number
  profitFactor50: number
}

interface UnifiedOverviewData {
  overview?: {
    performance?: PerformanceMetrics
    strategies?: StrategyMetrics[]
    indications?: IndicationMetrics[]
    symbols?: SymbolStats[]
  }
}

interface PerformanceMetrics {
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

interface StatisticsOverviewV2Props {
  connections?: Array<{ id: string; name: string }> | string
}

const DEFAULT_PERFORMANCE: PerformanceMetrics = {
  last250Positions: { total: 0, winning: 0, losing: 0, winRate: 0, profitFactor: 0, totalProfit: 0 },
  last50Positions: { total: 0, winning: 0, losing: 0, winRate: 0, profitFactor: 0, totalProfit: 0 },
  last32Hours: { totalPositions: 0, totalProfit: 0, profitFactor: 0 },
}

const DEFAULT_STRATEGIES: StrategyMetrics[] = [
  { type: "base", count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
  { type: "main", count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
  { type: "real", count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
  { type: "live", count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
]

const DEFAULT_INDICATIONS: IndicationMetrics[] = [
  { type: "direction", totalCount: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
  { type: "move", totalCount: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
  { type: "active", totalCount: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
  { type: "optimal", totalCount: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
]

export function StatisticsOverviewV2({ connections }: StatisticsOverviewV2Props) {
  const [strategies, setStrategies] = useState<StrategyMetrics[]>(DEFAULT_STRATEGIES)
  const [indications, setIndications] = useState<IndicationMetrics[]>(DEFAULT_INDICATIONS)
  const [symbols, setSymbols] = useState<SymbolStats[]>([])
  const [performance, setPerformance] = useState<PerformanceMetrics>(DEFAULT_PERFORMANCE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hasData, setHasData] = useState(false)

  const toNumber = useCallback((value: unknown, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }
    return fallback
  }, [])

  const fetchWithTimeout = useCallback(async (url: string, timeout = 8000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }, [])

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(prev => !hasData ? true : prev)
      setError(null)

      const unifiedResponse = await fetchWithTimeout("/api/main/system-stats-v3")

      if (!unifiedResponse.ok) {
        throw new Error(`Failed unified statistics request: ${unifiedResponse.status}`)
      }

      const unifiedData = await unifiedResponse.json() as UnifiedOverviewData

      let dataReceived = false

      const overview = unifiedData?.overview || {}
      const performanceData = overview.performance || DEFAULT_PERFORMANCE
      const strategiesData = overview.strategies || DEFAULT_STRATEGIES
      const indicationsData = overview.indications || DEFAULT_INDICATIONS
      const symbolsData = overview.symbols || []

      if (performanceData.last250Positions.total > 0 || strategiesData.some((item) => item.count > 0) || indicationsData.some((item) => item.totalCount > 0) || symbolsData.length > 0) {
        dataReceived = true
      }

      setPerformance(performanceData)
      setStrategies(strategiesData)
      setIndications(indicationsData)
      setSymbols(symbolsData.slice(0, 22))

      setHasData(dataReceived)
      setLastUpdated(new Date())
      setLoading(false)
      setRetryCount(0)
    } catch (err) {
      console.error("[Statistics] Error loading data:", err)
      setError("Failed to load statistics. Retrying...")
      setLoading(false)
      setRetryCount(prev => Math.min(prev + 1, 5))
    }
  }, [fetchWithTimeout, toNumber, hasData])

  useEffect(() => {
    loadStatistics()
    const interval = setInterval(loadStatistics, 15000)
    return () => clearInterval(interval)
  }, [loadStatistics])

  const handleRefresh = () => {
    setRetryCount(0)
    setError(null)
    loadStatistics()
  }

  const hasAnyData = performance.last250Positions.total > 0 || 
                     strategies.some(s => s.count > 0) || 
                     indications.some(i => i.totalCount > 0) || 
                     symbols.length > 0

  return (
    <Card className="col-span-full bg-gradient-to-br from-card to-card/50 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trading Statistics Overview</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && retryCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
          </div>
        )}

        {!hasAnyData && !loading ? (
          <div className="text-center py-8 space-y-3">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-lg font-medium">No Trading Data Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enable a connection in Settings and start the trade engine to see statistics.
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <>
            {/* PERFORMANCE METRICS */}
            <div className="space-y-3 pb-4 border-b">
              <div className="text-sm font-semibold text-muted-foreground">Performance Metrics</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Last 250 Positions</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">{(performance.last250Positions.winRate * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit Factor</div>
                      <div className={`font-semibold ${performance.last250Positions.profitFactor >= 1.5 ? "text-green-600" : performance.last250Positions.profitFactor >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                        {performance.last250Positions.profitFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs pt-1 border-t">
                    <div className="text-muted-foreground">Total Profit</div>
                    <div className="font-semibold">${performance.last250Positions.totalProfit.toFixed(2)}</div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Last 50 Positions</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">{(performance.last50Positions.winRate * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit Factor</div>
                      <div className={`font-semibold ${performance.last50Positions.profitFactor >= 1.5 ? "text-green-600" : performance.last50Positions.profitFactor >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                        {performance.last50Positions.profitFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs pt-1 border-t">
                    <div className="text-muted-foreground">Total Profit</div>
                    <div className="font-semibold">${performance.last50Positions.totalProfit.toFixed(2)}</div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Last 32 Hours</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Positions</div>
                      <div className="font-semibold">{performance.last32Hours.totalPositions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit Factor</div>
                      <div className={`font-semibold ${performance.last32Hours.profitFactor >= 1.5 ? "text-green-600" : performance.last32Hours.profitFactor >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                        {performance.last32Hours.profitFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs pt-1 border-t">
                    <div className="text-muted-foreground">Total Profit</div>
                    <div className="font-semibold">${performance.last32Hours.totalProfit.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* STRATEGIES */}
            <div className="space-y-3 pb-4 border-b">
              <div className="text-sm font-semibold text-muted-foreground">Strategy Types</div>
              <div className="space-y-2">
                {strategies.map((strategy) => (
                  <div key={strategy.type} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs font-semibold">
                          {strategy.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{strategy.count} strat</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs md:grid-cols-4">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Win Rate</span>
                        <span className="font-semibold text-sm">{(strategy.winRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Drawdown</span>
                        <span className={`font-semibold text-sm ${strategy.drawdown > 20 ? "text-red-600" : strategy.drawdown > 10 ? "text-orange-600" : "text-green-600"}`}>
                          {strategy.drawdown.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Time (h)</span>
                        <span className="font-semibold text-sm">{strategy.drawdownHours.toFixed(1)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">PF Avg</span>
                        <span className={`font-semibold text-sm ${((strategy.profitFactor250 + strategy.profitFactor50) / 2) >= 1.5 ? "text-green-600" : ((strategy.profitFactor250 + strategy.profitFactor50) / 2) >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                          {((strategy.profitFactor250 + strategy.profitFactor50) / 2).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t mt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PF (250)</span>
                        <span className={`font-semibold ${strategy.profitFactor250 >= 1.5 ? "text-green-600" : strategy.profitFactor250 >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                          {strategy.profitFactor250.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PF (50)</span>
                        <span className={`font-semibold ${strategy.profitFactor50 >= 1.5 ? "text-green-600" : strategy.profitFactor50 >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                          {strategy.profitFactor50.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INDICATIONS */}
            <div className="space-y-3 pb-4 border-b">
              <div className="text-sm font-semibold text-muted-foreground">Indication Types</div>
              <div className="space-y-2">
                {indications.map((indication) => (
                  <div key={indication.type} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`capitalize text-xs font-semibold ${
                            indication.type === "direction" ? "border-blue-500 text-blue-600" :
                            indication.type === "move" ? "border-green-500 text-green-600" :
                            indication.type === "active" ? "border-orange-500 text-orange-600" :
                            "border-purple-500 text-purple-600"
                          }`}
                        >
                          {indication.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{indication.totalCount} signals</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {indication.lastTrigger ? indication.lastTrigger.toLocaleTimeString() : "Never"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs md:grid-cols-3">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Signal Strength</span>
                        <span className={`font-semibold text-sm ${indication.avgSignalStrength >= 0.7 ? "text-green-600" : indication.avgSignalStrength >= 0.4 ? "text-yellow-600" : "text-red-600"}`}>
                          {indication.avgSignalStrength.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Profit Factor</span>
                        <span className={`font-semibold text-sm ${indication.profitFactor >= 1.5 ? "text-green-600" : indication.profitFactor >= 1.0 ? "text-blue-600" : "text-red-600"}`}>
                          {indication.profitFactor.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Total Count</span>
                        <span className="font-semibold text-sm">{indication.totalCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SYMBOLS */}
            {symbols.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-muted-foreground">Symbols Overview ({symbols.length})</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                  {symbols.map((symbol) => (
                    <div key={symbol.symbol} className="rounded-lg border bg-card px-2 py-2 text-center hover:bg-card/80 transition-colors min-w-0">
                      <div className="font-semibold text-xs truncate" title={symbol.symbol}>{symbol.symbol}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {symbol.livePositions} live
                      </div>
                      <div className="text-[11px] mt-1 leading-tight">
                        <div className={symbol.profitFactor250 >= 1.5 ? "text-green-600" : symbol.profitFactor250 >= 1.0 ? "text-blue-600" : "text-red-600"}>
                          PF250: {symbol.profitFactor250.toFixed(1)}
                        </div>
                        <div className={symbol.profitFactor50 >= 1.5 ? "text-green-600" : symbol.profitFactor50 >= 1.0 ? "text-blue-600" : "text-red-600"}>
                          PF50: {symbol.profitFactor50.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                <strong>Strategies</strong> (base, main, real, live) are complexity levels for trading strategies evaluated on pseudo positions.
                <br />
                <strong>Indications</strong> (direction, move, active, optimal) are independent signal types that drive strategy evaluation.
                <br />
                Direction (trend reversals) • Move (volatility) • Active (volume/activity) • Optimal (combined signals)
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
