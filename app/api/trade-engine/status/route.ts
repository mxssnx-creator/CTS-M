import { NextResponse } from "next/server"
import { getRedisClient, initRedis, getActiveConnectionsForEngine } from "@/lib/redis-db"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { getConnectionObservability } from "@/lib/connection-observability"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const requestUrl = arguments[0] instanceof Request ? new URL(arguments[0].url) : null
    const requestedConnectionId = requestUrl?.searchParams.get("connectionId") || null
    await initRedis()
    const client = getRedisClient()
    const coordinator = getGlobalTradeEngineCoordinator()
    
    // Read global engine state from Redis hash
    const engineHash = await client.hgetall("trade_engine:global") || {}
    const isGloballyRunning = engineHash.status === "running"
    const isGloballyPaused = engineHash.status === "paused"
    
    // Also check in-memory coordinator state
    const coordinatorRunning = coordinator?.isRunning() || false
    
    // If coordinator says running but Redis says not, fix Redis
    if (coordinatorRunning && !isGloballyRunning) {
      await client.hset("trade_engine:global", {
        status: "running",
        started_at: new Date().toISOString(),
        coordinator_ready: "true",
      })
    }
    
    // Effective running state: either Redis or coordinator says running
    const effectivelyRunning = isGloballyRunning || coordinatorRunning
    
    // Get active connections
    let connections = await getActiveConnectionsForEngine()
    if (requestedConnectionId) {
      connections = connections.filter((conn: any) => conn.id === requestedConnectionId)
    }
    
    if (connections.length === 0) {
      // Get all connections to explain why none are active
      const { getAllConnections } = await import("@/lib/redis-db")
      const allConnections = await getAllConnections()
      
      // Analyze why no connections are active
      const analysis = {
        total: allConnections.length,
        withCredentials: allConnections.filter((c: any) => 
          !!(c.api_key) && c.api_key.length > 10 && !!(c.api_secret) && c.api_secret.length > 10
        ).length,
        inActivePanel: allConnections.filter((c: any) => 
          c.is_active_inserted === "1" || c.is_active_inserted === true
        ).length,
        dashboardEnabled: allConnections.filter((c: any) => 
          c.is_enabled_dashboard === "1" || c.is_enabled_dashboard === true
        ).length,
      }
      
      return NextResponse.json({
        success: true,
        running: effectivelyRunning,
        isRunning: effectivelyRunning,
        paused: isGloballyPaused,
        status: effectivelyRunning ? "running" : (isGloballyPaused ? "paused" : "stopped"),
        activeEngineCount: coordinator?.getActiveEngineCount() || 0,
        connections: [],
        summary: { total: 0, running: 0, stopped: 0, totalTrades: 0, totalPositions: 0, errors: 0 },
        analysis,
        requirements: {
          message: "No connections eligible for processing",
          needed: [
            analysis.withCredentials === 0 ? "Add API credentials to a connection" : null,
            analysis.inActivePanel === 0 ? "Add a connection to the Active panel" : null,
            analysis.dashboardEnabled === 0 ? "Enable a connection via the dashboard toggle" : null,
          ].filter(Boolean),
          setupEndpoint: "POST /api/system/demo-setup with api_key, api_secret, exchange"
        }
      })
    }

    // Build connection status for ACTIVE connections only
    const connectionStatuses = await Promise.all(
      connections.map(async (conn: any) => {
        try {
          const observability = await getConnectionObservability(conn.id)
          const progressionState = observability.progression.raw
          const positionsCount = observability.counts.positions
          const tradesCount = observability.counts.trades

          // Determine if this connection's engine is actively running
          const connectionRunning = (effectivelyRunning && !isGloballyPaused) || observability.engine.status === "running"

          return {
            id: conn.id,
            name: conn.name,
            exchange: conn.exchange,
            status: connectionRunning ? "running" : "stopped",
            connectionId: conn.id,
            connectionName: conn.name,
            enabled: conn.is_enabled_dashboard === true || conn.is_enabled_dashboard === "1",
            activelyUsing: conn.is_enabled_dashboard === true || conn.is_enabled_dashboard === "1",
            positions: positionsCount,
            trades: tradesCount,
            health: {
              overall: observability.logSummary.error > 0 ? "degraded" : "healthy",
              components: {
                indications: {
                  status: observability.counts.indications > 0 ? "healthy" : "degraded",
                  lastCycleDuration: observability.engine.indicationAvgDuration,
                  errorCount: observability.logSummary.error,
                  successRate: progressionState.cycleSuccessRate || 0,
                },
                strategies: {
                  status: observability.counts.strategies > 0 ? "healthy" : "degraded",
                  lastCycleDuration: observability.engine.strategyAvgDuration,
                  errorCount: observability.logSummary.error,
                  successRate: progressionState.tradeSuccessRate || progressionState.cycleSuccessRate || 0,
                },
                realtime: {
                  status: observability.engine.realtimeCycles > 0 || positionsCount > 0 ? "healthy" : "degraded",
                  lastCycleDuration: observability.engine.realtimeAvgDuration,
                  errorCount: observability.logSummary.error,
                  successRate: progressionState.tradeSuccessRate || 0,
                },
              },
            },
            metrics: {
              indicationCycleCount: observability.engine.indicationCycles,
              strategyCycleCount: observability.engine.strategyCycles,
              realtimeCycleCount: observability.engine.realtimeCycles,
              indicationAvgDuration: observability.engine.indicationAvgDuration,
              strategyAvgDuration: observability.engine.strategyAvgDuration,
              realtimeAvgDuration: observability.engine.realtimeAvgDuration,
              cycleTimeMs: observability.engine.lastCycleDuration,
            },
            summary: {
              symbolsActive: Math.max(observability.engine.activeSymbols, 1),
              prehistoricDataSize: observability.prehistoric.candlesProcessed || progressionState.prehistoricCandlesProcessed || progressionState.prehistoricCyclesCompleted || 0,
              indicationTypes: {
                ...observability.indications,
                total: observability.counts.indications,
              },
              strategyCounts: observability.strategies,
              realtimeCycles: observability.engine.realtimeCycles,
              logs: observability.logSummary,
              prehistoric: observability.prehistoric,
            },
            progression: {
              cycles_completed: observability.progression.cyclesCompleted,
              successful_cycles: observability.progression.successfulCycles,
              failed_cycles: observability.progression.failedCycles,
              cycle_success_rate: observability.progression.cycleSuccessRate.toFixed(1),
              total_trades: observability.progression.totalTrades,
              successful_trades: observability.progression.successfulTrades,
              trade_success_rate: observability.progression.tradeSuccessRate.toFixed(1),
              total_profit: observability.progression.totalProfit.toFixed(2),
              last_cycle_time: observability.progression.lastCycleTime,
            },
            state: progressionState,
            connection: observability,
          }
        } catch (error) {
          console.error(`[v0] [Status] Error processing connection ${conn.id}:`, error)
          return {
            id: conn.id,
            name: conn.name,
            exchange: conn.exchange,
            status: "error",
            enabled: false,
            activelyUsing: false,
            positions: 0,
            trades: 0,
            progression: { cycles_completed: 0, successful_cycles: 0, failed_cycles: 0 },
            state: {},
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      })
    )

    // Calculate summary
    const summary = {
      total: connectionStatuses.length,
      running: connectionStatuses.filter((c: any) => c.status === "running").length,
      stopped: connectionStatuses.filter((c: any) => c.status === "stopped" || c.status === "error").length,
      totalTrades: connectionStatuses.reduce((sum: number, c: any) => sum + (c.trades || 0), 0),
      totalPositions: connectionStatuses.reduce((sum: number, c: any) => sum + (c.positions || 0), 0),
      errors: connectionStatuses.filter((c: any) => c.error).length,
    }

    const responseBody = {
      success: true,
      running: effectivelyRunning,
      isRunning: effectivelyRunning,
      paused: isGloballyPaused,
      status: effectivelyRunning ? "running" : (isGloballyPaused ? "paused" : "stopped"),
      activeEngineCount: coordinator?.getActiveEngineCount() || 0,
      connections: connectionStatuses,
      summary,
    }

    if (requestedConnectionId) {
      return NextResponse.json({
        ...responseBody,
        connection: connectionStatuses[0] || null,
      })
    }

    console.log(`[v0] [Status] Returning ${connectionStatuses.length} active connections, global running: ${isGloballyRunning}`)
    return NextResponse.json(responseBody)
  } catch (error) {
    console.error("[v0] [Status] Error:", error)
    return NextResponse.json(
      {
        success: false,
        running: false,
        isRunning: false,
        paused: false,
        status: "error",
        connections: [],
        summary: { total: 0, running: 0, stopped: 0, totalTrades: 0, totalPositions: 0, errors: 1 },
        error: error instanceof Error ? error.message : "Failed to fetch trade engine status",
      },
      { status: 500 }
    )
  }
}
