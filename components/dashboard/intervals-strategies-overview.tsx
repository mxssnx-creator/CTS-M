"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Activity, Zap, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { normalizeProgressionStatus } from "@/lib/progression-status"

interface IntervalHealth {
  enabled: boolean
  isRunning: boolean
  isProgressing: boolean
  intervalTime: number
  timeout: number
  lastStart?: string
  lastEnd?: string
}

interface IntervalsData {
  direction?: IntervalHealth
  move?: IntervalHealth
  active?: IntervalHealth
  optimal?: IntervalHealth
}

interface StrategyStats {
  type: string
  enabled: boolean
  rangeCount: number
  activePositions: number
  totalIndications: number
  successRate: number
   avgProfitFactor?: number
   avgDrawdownHours?: number
   countSets?: number
}

interface SystemStatsResponse {
  validation?: {
    valid: boolean
    issues: string[]
  }
  overview?: {
    processing?: {
      phases?: {
        historic?: {
          isLoaded?: boolean
          isProcessing?: boolean
          lastUpdatedAt?: string
        }
        realtime?: {
          isActive?: boolean
          isStale?: boolean
          lastUpdatedAt?: string
        }
      }
      progression?: {
        phase?: string
      }
      indications?: Record<string, number>
      strategies?: Record<string, number>
      averages?: {
        realProfitFactor?: number
        realDrawdownHours?: number
        realPositionEvaluation?: number
      }
    }
  }
  activeConnections?: {
    total?: number
    active?: number
    liveTrade?: number
  }
  tradeEngines?: {
    mainEnabled?: boolean
    liveTradeEnabled?: boolean
  }
}

export function IntervalsStrategiesOverview({ connections }: { connections: any[] }) {
  const [intervals, setIntervals] = useState<IntervalsData>({})
  const [strategies, setStrategies] = useState<StrategyStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [validation, setValidation] = useState<{ valid: boolean; issues: string[] } | null>(null)

  useEffect(() => {
    loadData()
    const intervalId = setInterval(loadData, 5000)
    return () => clearInterval(intervalId)
  }, [connections])

  const loadData = async () => {
    try {
      const statsRes = await fetch("/api/main/system-stats-v3", { cache: "no-store" }).catch(() => null)
      if (!statsRes?.ok) {
        throw new Error("Failed to fetch intervals and strategies overview")
      }

      const statsData = await statsRes.json() as SystemStatsResponse
      setValidation(statsData?.validation || null)
      if (statsData?.validation && !statsData.validation.valid) {
        setIntervals({})
        setStrategies([])
        return
      }

      const processing = statsData?.overview?.processing
      const normalized = normalizeProgressionStatus(processing?.progression?.phase)
      const historicalLoaded = Boolean(processing?.phases?.historic?.isLoaded)
      const historicalProcessing = Boolean(processing?.phases?.historic?.isProcessing)
      const realtimeActive = Boolean(processing?.phases?.realtime?.isActive)
      const realtimeStale = Boolean(processing?.phases?.realtime?.isStale)
      const indicationCounts = processing?.indications || {}
      const strategyCounts = processing?.strategies || {}

      setIntervals({
        direction: {
          enabled: (indicationCounts.direction || 0) > 0 || historicalLoaded || historicalProcessing || realtimeActive,
          isRunning: historicalLoaded || historicalProcessing,
          isProgressing: historicalProcessing,
          intervalTime: 1,
          timeout: 5,
          lastEnd: processing?.phases?.historic?.lastUpdatedAt,
        },
        move: {
          enabled: (indicationCounts.move || 0) > 0 || realtimeActive || realtimeStale,
          isRunning: realtimeActive,
          isProgressing: realtimeActive && !realtimeStale,
          intervalTime: 1,
          timeout: 5,
          lastEnd: processing?.phases?.realtime?.lastUpdatedAt,
        },
        active: {
          enabled: (indicationCounts.active || 0) > 0 || realtimeActive,
          isRunning: realtimeActive,
          isProgressing: realtimeActive && !normalized.isInterrupted,
          intervalTime: 1,
          timeout: 5,
          lastEnd: processing?.phases?.realtime?.lastUpdatedAt,
        },
        optimal: {
          enabled: (indicationCounts.optimal || 0) > 0 || (strategyCounts.real || 0) > 0,
          isRunning: realtimeActive,
          isProgressing: normalized.isRecovering || (!normalized.isInterrupted && realtimeActive),
          intervalTime: 2,
          timeout: 10,
          lastEnd: processing?.phases?.realtime?.lastUpdatedAt,
        },
      })

      const fallbackStrategies: StrategyStats[] = [
        {
          type: "base",
          enabled: true,
          rangeCount: strategyCounts.base || 0,
          activePositions: statsData.activeConnections?.total || 0,
          totalIndications: indicationCounts.direction || 0,
          successRate: normalized.isInterrupted ? 0 : 100,
          countSets: strategyCounts.base || 0,
        },
        {
          type: "main",
          enabled: statsData.tradeEngines?.mainEnabled || false,
          rangeCount: strategyCounts.main || 0,
          activePositions: statsData.activeConnections?.active || 0,
          totalIndications: indicationCounts.move || 0,
          successRate: normalized.isRecovering ? 50 : normalized.isInterrupted ? 0 : 100,
          countSets: strategyCounts.main || 0,
        },
        {
          type: "real",
          enabled: statsData.tradeEngines?.liveTradeEnabled || false,
          rangeCount: strategyCounts.real || 0,
          activePositions: statsData.activeConnections?.liveTrade || 0,
          totalIndications: indicationCounts.active || 0,
          successRate: normalized.isInterrupted ? 0 : 100,
          avgProfitFactor: processing?.averages?.realProfitFactor || 0,
          avgDrawdownHours: processing?.averages?.realDrawdownHours || 0,
          countSets: strategyCounts.real || 0,
        },
      ]
      setStrategies(fallbackStrategies)
    } catch (error) {
      console.error("[IntervalsStrategies] Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIntervalStatus = (interval?: IntervalHealth) => {
    if (!interval || !interval.enabled) return "disabled"
    if (interval.isProgressing) return "progressing"
    if (interval.isRunning) return "running"
    return "stopped"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "progressing":
        return "bg-yellow-500"
      case "running":
        return "bg-green-500"
      case "stopped":
        return "bg-red-500"
      case "disabled":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "progressing":
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case "running":
        return <CheckCircle className="h-3 w-3" />
      case "stopped":
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "N/A"
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intervals & Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Intervals Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle>Intervals Health</CardTitle>
              {validation && <Badge variant={validation.valid ? "outline" : "destructive"}>{validation.valid ? 'validated' : 'invalid'}</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>Real-time interval progression status for all indication types</CardDescription>
          {validation && !validation.valid && validation.issues.length > 0 && (
            <div className="text-xs text-red-600">{validation.issues.join('; ')}</div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direction Interval */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold">Direction</span>
                </div>
                <Badge className={`${getStatusColor(getIntervalStatus(intervals.direction))} text-white`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getIntervalStatus(intervals.direction))}
                    {getIntervalStatus(intervals.direction)}
                  </div>
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interval:</span>
                  <span className="font-mono">{intervals.direction?.intervalTime || 1}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-mono">{intervals.direction?.timeout || 5}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Start:</span>
                  <span className="text-xs">{formatTimestamp(intervals.direction?.lastStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last End:</span>
                  <span className="text-xs">{formatTimestamp(intervals.direction?.lastEnd)}</span>
                </div>
              </div>
            </div>

            {/* Move Interval */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">Move</span>
                </div>
                <Badge className={`${getStatusColor(getIntervalStatus(intervals.move))} text-white`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getIntervalStatus(intervals.move))}
                    {getIntervalStatus(intervals.move)}
                  </div>
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interval:</span>
                  <span className="font-mono">{intervals.move?.intervalTime || 1}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-mono">{intervals.move?.timeout || 5}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Start:</span>
                  <span className="text-xs">{formatTimestamp(intervals.move?.lastStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last End:</span>
                  <span className="text-xs">{formatTimestamp(intervals.move?.lastEnd)}</span>
                </div>
              </div>
            </div>

            {/* Active Interval */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">Active</span>
                </div>
                <Badge className={`${getStatusColor(getIntervalStatus(intervals.active))} text-white`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getIntervalStatus(intervals.active))}
                    {getIntervalStatus(intervals.active)}
                  </div>
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interval:</span>
                  <span className="font-mono">{intervals.active?.intervalTime || 1}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-mono">{intervals.active?.timeout || 5}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Start:</span>
                  <span className="text-xs">{formatTimestamp(intervals.active?.lastStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last End:</span>
                  <span className="text-xs">{formatTimestamp(intervals.active?.lastEnd)}</span>
                </div>
              </div>
            </div>

            {/* Optimal Interval */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">Optimal</span>
                </div>
                <Badge className={`${getStatusColor(getIntervalStatus(intervals.optimal))} text-white`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getIntervalStatus(intervals.optimal))}
                    {getIntervalStatus(intervals.optimal)}
                  </div>
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interval:</span>
                  <span className="font-mono">{intervals.optimal?.intervalTime || 2}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-mono">{intervals.optimal?.timeout || 10}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Start:</span>
                  <span className="text-xs">{formatTimestamp(intervals.optimal?.lastStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last End:</span>
                  <span className="text-xs">{formatTimestamp(intervals.optimal?.lastEnd)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategies Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Strategies Overview
          </CardTitle>
          <CardDescription>Active strategies, ranges, and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No strategies configured</div>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{strategy.type}</span>
                      <Badge variant={strategy.enabled ? "default" : "secondary"}>
                        {strategy.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {strategy.rangeCount} ranges
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Active Positions</div>
                      <div className="text-lg font-semibold">{strategy.activePositions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Total Indications</div>
                      <div className="text-lg font-semibold">{strategy.totalIndications}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Success Rate</div>
                      <div className="text-lg font-semibold">{strategy.successRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Count Sets</div>
                      <div className="text-base font-semibold">{strategy.countSets || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Avg Profit Factor</div>
                      <div className="text-base font-semibold">{(strategy.avgProfitFactor || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Avg Drawdown Time</div>
                      <div className="text-base font-semibold">{(strategy.avgDrawdownHours || 0).toFixed(1)}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
