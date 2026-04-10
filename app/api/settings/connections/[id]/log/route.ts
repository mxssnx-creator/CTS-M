import { NextResponse } from "next/server"
import { getAllConnections } from "@/lib/redis-db"
import { getProgressionLogs } from "@/lib/engine-progression-logs"
import { WorkflowLogger } from "@/lib/workflow-logger"
import { initRedis, getRedisClient, getSettings } from "@/lib/redis-db"
import { ProgressionStateManager } from "@/lib/progression-state-manager"

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

type LogLevel = "error" | "warn" | "warning" | "info" | "debug"

function normalizeLogLevel(level: unknown): LogLevel {
  const value = String(level || "").toLowerCase()
  if (value === "error" || value === "failed") return "error"
  if (value === "warn" || value === "warning") return "warn"
  if (value === "debug") return "debug"
  return "info"
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    
    await initRedis()
    
    const allConnections = await getAllConnections()
    const connection = allConnections.find((conn: any) => conn.id === id) || null

    const [progressionLogs, workflowLogs, progressionState, engineState] = await Promise.all([
      getProgressionLogs(id),
      WorkflowLogger.getLogs(id, 100),
      ProgressionStateManager.getProgressionState(connectionId),
      getSettings(`trade_engine_state:${connectionId}`)
    ])

    const mappedProgressionLogs = progressionLogs.map((log) => ({
      source: "progression",
      timestamp: log.timestamp,
      level: normalizeLogLevel(log.level),
      phase: log.phase || "progression",
      message: log.message,
      details: log.details || {},
    }))
    const mappedWorkflowLogs = workflowLogs.map((log) => ({
      source: "workflow",
      timestamp: new Date(log.timestamp).toISOString(),
      level: normalizeLogLevel(log.status),
      phase: log.eventType || "workflow",
      message: log.message,
      details: {
        symbol: log.symbol,
        duration: log.duration,
        ...(log.details || {}),
      },
    }))

    const logs = [...mappedProgressionLogs, ...mappedWorkflowLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100)

    const levelSummary = logs.reduce(
      (acc, log) => {
        if (log.level === "error") acc.errors += 1
        else if (log.level === "warn" || log.level === "warning") acc.warnings += 1
        else if (log.level === "debug") acc.debug += 1
        else acc.info += 1
        return acc
      },
      { errors: 0, warnings: 0, info: 0, debug: 0 },
    )

    const phaseSummary = logs.reduce<Record<string, number>>((acc, log) => {
      const phase = log.phase || "unknown"
      acc[phase] = (acc[phase] || 0) + 1
      return acc
    }, {})

     // Enhanced summary with prehistoric data, indications, strategies, and cycle info
     const effectivePrehistoricSymbols = Math.max(
       progressionState.prehistoricSymbolsProcessedCount || 0,
       Array.isArray(progressionState.prehistoricSymbolsProcessed) ? progressionState.prehistoricSymbolsProcessed.length : 0,
       toNumber(engineState?.config_set_symbols_processed),
     )
     const effectivePrehistoricCandles = Math.max(
       progressionState.prehistoricCandlesProcessed || 0,
       toNumber(engineState?.config_set_candles_processed),
     )
     const effectiveIndicationDirection = Math.max(progressionState.indicationsDirectionCount || 0, toNumber(engineState?.indications_direction_count))
     const effectiveIndicationMove = Math.max(progressionState.indicationsMoveCount || 0, toNumber(engineState?.indications_move_count))
     const effectiveIndicationActive = Math.max(progressionState.indicationsActiveCount || 0, toNumber(engineState?.indications_active_count))
     const effectiveIndicationOptimal = Math.max(progressionState.indicationsOptimalCount || 0, toNumber(engineState?.indications_optimal_count))
     const effectiveStrategiesBase = Math.max(progressionState.strategiesBaseTotal || 0, toNumber(engineState?.strategies_base_total))
     const effectiveStrategiesMain = Math.max(progressionState.strategiesMainTotal || 0, toNumber(engineState?.strategies_main_total))
     const effectiveStrategiesReal = Math.max(progressionState.strategiesRealTotal || 0, toNumber(engineState?.strategies_real_total))
     const effectiveCyclesCompleted = Math.max(
       progressionState.cyclesCompleted || 0,
       toNumber(engineState?.indication_cycle_count),
       toNumber(engineState?.strategy_cycle_count),
       toNumber(engineState?.realtime_cycle_count),
     )

     const enhancedSummary = {
       total: logs.length,
       ...levelSummary,
       phases: phaseSummary,
       latestTimestamp: logs[0]?.timestamp || null,
       oldestTimestamp: logs[logs.length - 1]?.timestamp || null,
       
        // Prehistoric data processing info
        prehistoricData: {
          cyclesCompleted: progressionState.prehistoricCyclesCompleted || 0,
          symbolsProcessed: effectivePrehistoricSymbols,
          candlesProcessed: effectivePrehistoricCandles,
          phaseActive: progressionState.prehistoricPhaseActive || false,
          lastUpdate: progressionState.lastUpdate?.toISOString() || null
        },
       
        // Indications by type (direction, move, active, optimal, auto)
        indicationsCounts: {
          direction: effectiveIndicationDirection,
          move: effectiveIndicationMove,
          active: effectiveIndicationActive,
          optimal: effectiveIndicationOptimal,
          auto: progressionState.indicationsAutoCount || 0
        },
       
       // Strategy count sets and evaluated counts
        strategyCounts: {
          base: {
            total: effectiveStrategiesBase,
            evaluated: progressionState.strategyEvaluatedBase || 0,
            pending: Math.max(0, effectiveStrategiesBase - (progressionState.strategyEvaluatedBase || 0))
          },
          main: {
            total: effectiveStrategiesMain,
            evaluated: progressionState.strategyEvaluatedMain || 0,
            pending: Math.max(0, effectiveStrategiesMain - (progressionState.strategyEvaluatedMain || 0))
          },
          real: {
            total: effectiveStrategiesReal,
            evaluated: progressionState.strategyEvaluatedReal || 0,
            pending: Math.max(0, effectiveStrategiesReal - (progressionState.strategyEvaluatedReal || 0))
          }
        },
       
        // Engine performance info
        enginePerformance: {
          cycleTimeMs: progressionState.cycleTimeMs || 0,
          cyclesCompleted: effectiveCyclesCompleted,
          successfulCycles: progressionState.successfulCycles || 0,
          failedCycles: progressionState.failedCycles || 0,
          cycleSuccessRate: progressionState.cycleSuccessRate || 0,
         totalTrades: progressionState.totalTrades || 0,
         successfulTrades: progressionState.successfulTrades || 0,
         tradeSuccessRate: progressionState.tradeSuccessRate || 0,
         totalProfit: progressionState.totalProfit || 0,
         lastCycleTime: progressionState.lastCycleTime?.toISOString() || null,
         intervalsProcessed: progressionState.intervalsProcessed || 0,
         indicationsCount: progressionState.indicationsCount || 0,
         strategiesCount: progressionState.strategiesCount || 0
       }
     }

    return NextResponse.json({
      success: true,
      connection: connection
        ? {
            id: connection.id,
            name: connection.name || connection.exchange || connection.id,
            exchange: connection.exchange || "unknown",
            is_enabled: connection.is_enabled,
            is_enabled_dashboard: connection.is_enabled_dashboard,
            is_active_inserted: connection.is_active_inserted,
            last_test_status: connection.last_test_status || connection.test_status || "untested",
            last_test_timestamp: connection.last_test_timestamp || connection.updated_at || null,
          }
        : null,
      logs: logs || [],
      summary: enhancedSummary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error fetching connection logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
