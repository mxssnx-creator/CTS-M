'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, BarChart3, TrendingUp, Zap } from 'lucide-react'
import type { ProcessingMetrics } from '@/lib/processing-metrics'
import { normalizeProgressionStatus } from '@/lib/progression-status'

interface ProcessingProgressPanelProps {
  connectionId?: string
}

interface UnifiedProcessingOverview {
  validation?: {
    valid: boolean
    issues: string[]
  }
  overview?: {
    processing?: {
      connectionId?: string
      progression?: {
        phase?: string
        cycleSuccessRate?: number
        totalTrades?: number
        cyclesCompleted?: number
        successfulCycles?: number
        failedCycles?: number
      }
      phases?: {
        historic?: {
          isLoaded?: boolean
          isProcessing?: boolean
          symbolsProcessed?: number
          symbolsTotal?: number
          durationMs?: number
        }
        realtime?: {
          isActive?: boolean
          isStale?: boolean
          cycles?: {
            realtime?: number
          }
          positions?: number
        }
      }
      counts?: {
        logs?: number
      }
      prehistoric?: {
        loaded?: boolean
        lastProcessedAt?: string | null
        candlesProcessed?: number
      }
      cycles?: {
        completed?: number
        successful?: number
        failed?: number
        successRatio?: number
      }
      ratios?: {
        strategiesPerIndication?: number
        logsPerCycle?: number
      }
      averages?: {
        realtimeCycleDurationMs?: number
        realProfitFactor?: number
        realDrawdownHours?: number
        realPositionEvaluation?: number
      }
      strategies?: Record<string, number>
      indications?: Record<string, number>
    } | null
  }
}

export function ProcessingProgressPanel({ connectionId }: ProcessingProgressPanelProps) {
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<{ valid: boolean; issues: string[] } | null>(null)
  const strategyIndicationRatio = metrics
    ? (metrics.evaluationCounts.indicationBase + metrics.evaluationCounts.indicationMain) > 0
      ? ((metrics.evaluationCounts.strategyBase + metrics.evaluationCounts.strategyMain) / (metrics.evaluationCounts.indicationBase + metrics.evaluationCounts.indicationMain)).toFixed(2)
      : '0.00'
    : '0.00'

  useEffect(() => {
    if (!connectionId) {
      setLoading(false)
      return
    }

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/main/system-stats-v3`)
        if (!response.ok) {
          throw new Error('Failed to fetch processing overview')
        }
        const data = await response.json() as UnifiedProcessingOverview
        setValidation(data.validation || null)
        if (data.validation && !data.validation.valid) {
          setMetrics(null)
          setError(`Validated data issue: ${data.validation.issues.join(", ")}`)
          return
        }
        const processing = data.overview?.processing
        if (processing && processing.connectionId === connectionId) {
          const normalized = normalizeProgressionStatus(processing.progression?.phase)
          setMetrics({
            timestamp: new Date().toISOString(),
            phases: {
              prehistoric: {
                status: processing.phases?.historic?.isLoaded ? 'completed' : processing.phases?.historic?.isProcessing ? 'running' : 'idle',
                cycleCount: processing.cycles?.completed || processing.progression?.cyclesCompleted || 0,
                progress: processing.phases?.historic?.symbolsTotal ? ((processing.phases.historic.symbolsProcessed || 0) / processing.phases.historic.symbolsTotal) * 100 : 0,
                itemsProcessed: processing.phases?.historic?.symbolsProcessed || 0,
                itemsTotal: processing.phases?.historic?.symbolsTotal || 0,
                currentTimeframe: 'historical',
                duration: processing.averages?.realtimeCycleDurationMs || 0,
              },
              realtime: {
                status: normalized.isInterrupted ? 'error' : processing.phases?.realtime?.isActive ? 'running' : 'idle',
                cycleCount: processing.phases?.realtime?.cycles?.realtime || 0,
                progress: normalized.isRecovering ? 40 : processing.phases?.realtime?.isActive ? 100 : 0,
                itemsProcessed: processing.phases?.realtime?.positions || 0,
                itemsTotal: Math.max(processing.phases?.realtime?.positions || 0, 1),
                currentTimeframe: normalized.label,
                duration: 0,
                errorMessage: normalized.isInterrupted ? 'Realtime flow interrupted' : undefined,
              },
              indication: {
                status: (processing.indications?.direction || 0) > 0 ? 'running' : 'idle',
                cycleCount: processing.cycles?.successful || processing.progression?.successfulCycles || 0,
                progress: Math.min((processing.indications?.direction || 0) + (processing.indications?.move || 0), 100),
                itemsProcessed: (processing.indications?.direction || 0) + (processing.indications?.move || 0),
                itemsTotal: Math.max((processing.indications?.active || 0) + (processing.indications?.optimal || 0), 1),
                currentTimeframe: 'signals',
                duration: processing.averages?.realtimeCycleDurationMs || 0,
              },
              strategy: {
                status: ((processing.strategies?.base || 0) + (processing.strategies?.main || 0) + (processing.strategies?.real || 0)) > 0 ? 'running' : 'idle',
                cycleCount: processing.cycles?.failed || processing.progression?.failedCycles || 0,
                progress: Math.min((processing.strategies?.live || 0) * 10, 100),
                itemsProcessed: (processing.strategies?.base || 0) + (processing.strategies?.main || 0) + (processing.strategies?.real || 0),
                itemsTotal: Math.max((processing.strategies?.live || 0), 1),
                currentTimeframe: 'strategy',
                duration: processing.averages?.realtimeCycleDurationMs || 0,
              },
            },
            performanceMetrics: {
              avgCycleDuration: processing.averages?.realtimeCycleDurationMs || 0,
              totalProcessingTime: processing.phases?.historic?.durationMs || 0,
            },
            pseudoPositions: {
              totalCreated: processing.progression?.totalTrades || 0,
              currentActive: processing.phases?.realtime?.positions || 0,
            },
            evaluationCounts: {
              indicationBase: processing.indications?.direction || 0,
              indicationMain: processing.indications?.move || 0,
              strategyBase: processing.strategies?.base || 0,
              strategyMain: processing.strategies?.main || 0,
            },
          } as ProcessingMetrics)
          setError(null)
        } else {
          setError('No unified processing data yet. Start the engine and enable a connection to see progress.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [connectionId])

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300">Processing Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-400">Loading...</CardContent>
      </Card>
    )
  }

  if (error || !metrics) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Processing Progress
            {validation && <Badge variant={validation.valid ? "outline" : "destructive"} className="ml-2">{validation.valid ? 'validated' : 'invalid'}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {validation && !validation.valid && validation.issues.length > 0 && (
            <div className="text-[11px] text-red-300">{validation.issues.join('; ')}</div>
          )}
          <div className="text-xs text-slate-400">
            {error ? `Error: ${error}` : 'No processing data yet. Start the engine and enable a connection to see progress.'}
          </div>
             {['Prehistoric', 'Realtime', 'Indication', 'Strategy'].map((phase) => (
            <div key={phase} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
              <span className="text-xs text-slate-400">{phase}</span>
              <Badge variant="outline" className="text-[10px] py-0 bg-slate-700 text-slate-400 border-slate-600">
                idle
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const phases = [
    { key: 'prehistoric', label: 'Prehistoric', icon: Activity, color: 'bg-blue-500' },
    { key: 'realtime', label: 'Realtime', icon: TrendingUp, color: 'bg-green-500' },
    { key: 'indication', label: 'Indication', icon: Zap, color: 'bg-yellow-500' },
    { key: 'strategy', label: 'Strategy', icon: BarChart3, color: 'bg-purple-500' },
  ]

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Processing Progress
          {validation && <Badge variant={validation.valid ? "outline" : "destructive"} className="ml-2">{validation.valid ? 'validated' : 'invalid'}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Phase Progress */}
        <div className="space-y-2">
          {phases.map(({ key, label, icon: Icon, color }) => {
            const phase = metrics.phases[key as keyof typeof metrics.phases]
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300 font-medium">{label}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs py-0 px-1 ${
                        phase.status === 'completed'
                          ? 'bg-green-900 text-green-200 border-green-700'
                          : phase.status === 'running'
                            ? 'bg-blue-900 text-blue-200 border-blue-700'
                            : phase.status === 'error'
                              ? 'bg-red-900 text-red-200 border-red-700'
                              : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {phase.status}
                    </Badge>
                  </div>
                  <span className="text-slate-400">{phase.cycleCount} cycles</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${Math.min(phase.progress, 100)}%` }}
                  />
                </div>

                {/* Progress Text */}
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>
                    {phase.itemsProcessed} / {phase.itemsTotal}
                  </span>
                  <span>{Math.round(phase.progress)}%</span>
                </div>

                {/* Timeframe */}
                {phase.status === 'running' && (
                  <div className="text-slate-400 text-xs">
                    Timeframe: {phase.currentTimeframe} | Duration: {(phase.duration / 1000).toFixed(1)}s
                  </div>
                )}

                {phase.errorMessage && (
                  <div className="text-red-400 text-xs mt-1">Error: {phase.errorMessage}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Performance Metrics */}
        <div className="pt-2 border-t border-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Avg Cycle Duration:</span>
            <span className="text-slate-200 font-medium">{metrics.performanceMetrics.avgCycleDuration.toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Processing Time:</span>
            <span className="text-slate-200 font-medium">{(metrics.performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Position Metrics */}
        <div className="pt-2 border-t border-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Positions Created:</span>
            <span className="text-slate-200 font-medium">{metrics.pseudoPositions.totalCreated}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Positions Active:</span>
            <span className="text-green-400 font-medium">{metrics.pseudoPositions.currentActive}</span>
          </div>
        </div>

        {/* Evaluation Counts */}
        <div className="pt-2 border-t border-slate-700 space-y-1">
          <div className="text-slate-400 font-medium mb-1">Evaluations</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Indication Base:</span>
              <span className="text-slate-200">{metrics.evaluationCounts.indicationBase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Indication Main:</span>
              <span className="text-slate-200">{metrics.evaluationCounts.indicationMain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Strategy Base:</span>
              <span className="text-slate-200">{metrics.evaluationCounts.strategyBase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Strategy Main:</span>
              <span className="text-slate-200">{metrics.evaluationCounts.strategyMain}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700 space-y-1">
          <div className="text-slate-400 font-medium mb-1">Cycle Details</div>
          <div className="flex justify-between">
            <span className="text-slate-400">Completed / Success / Failed:</span>
            <span className="text-slate-200 font-medium">
              {metrics.phases.prehistoric.cycleCount} / {metrics.phases.indication.cycleCount} / {metrics.phases.strategy.cycleCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Strategy/Indication Ratio:</span>
            <span className="text-slate-200 font-medium">{strategyIndicationRatio}</span>
          </div>
        </div>
      
        {/* Last Updated */}
        <div className="pt-2 border-t border-slate-700 text-slate-500 text-xs">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
