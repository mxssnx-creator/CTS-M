import { NextResponse } from "next/server"
import { getAllConnections, getConnectionTrades, getConnectionPositions, initRedis, getRedisClient } from "@/lib/redis-db"
import { SystemLogger } from "@/lib/system-logger"
import { ProgressionStateManager } from "@/lib/progression-state-manager"
import { getConnectionObservability } from "@/lib/connection-observability"
import { assessAndRecoverConnectionFlow } from "@/lib/engine-resilience"

export const dynamic = "force-dynamic"

/**
 * Check if an engine is running for a connection using Redis state (not in-memory)
 * This works across serverless cold starts and process restarts
 */
async function getEngineStatusFromRedis(connectionId: string): Promise<{
  isRunning: boolean
  status: string
  startedAt: string | null
  lastCycleAt: string | null
  indicationCycles: number
  strategyCycles: number
  realtimeCycles: number
}> {
  try {
    await initRedis()
    const client = getRedisClient()
    
    // Check per-connection engine state
    const engineState = await client.hgetall(`trade_engine:${connectionId}`)
    const isRunning = engineState?.status === "running" || engineState?.status === "starting"
    
    // Get cycle counts from Redis keys
    const indicationCycles = parseInt(await client.get(`engine:indication_cycles:${connectionId}`) || "0", 10)
    const strategyCycles = parseInt(await client.get(`engine:strategy_cycles:${connectionId}`) || "0", 10)
    const realtimeCycles = parseInt(await client.get(`engine:realtime_cycles:${connectionId}`) || "0", 10)
    
    return {
      isRunning,
      status: engineState?.status || "unknown",
      startedAt: engineState?.started_at || null,
      lastCycleAt: engineState?.last_cycle_at || null,
      indicationCycles,
      strategyCycles,
      realtimeCycles,
    }
  } catch {
    return {
      isRunning: false,
      status: "unknown",
      startedAt: null,
      lastCycleAt: null,
      indicationCycles: 0,
      strategyCycles: 0,
      realtimeCycles: 0,
    }
  }
}

/**
 * Lazy engine initialization: start engines for enabled connections on first request
 * This ensures engines are running even after serverless cold starts
 */
async function lazyInitEngines(): Promise<void> {
  try {
    const { getGlobalTradeEngineCoordinator } = await import("@/lib/trade-engine")
    const { loadSettingsAsync } = await import("@/lib/settings-storage")
    
    const coordinator = getGlobalTradeEngineCoordinator()
    const allConnections = await getAllConnections()
    
    if (!Array.isArray(allConnections)) return
    
    const settings = await loadSettingsAsync()
    
    for (const conn of allConnections) {
      // Skip if engine already running in memory
      const hasEngine = coordinator.isEngineRunning(conn.id)
      if (hasEngine) continue
      
      // Check if connection is enabled for processing
      const isMainProcessing = (conn.is_inserted === "1" || conn.is_inserted === 1 || conn.is_inserted === true) &&
        (conn.is_enabled_dashboard === "1" || conn.is_enabled_dashboard === 1 || conn.is_enabled_dashboard === true)
      
      if (!isMainProcessing) continue
      
      // Check if engine is marked as running in Redis
      const redisStatus = await getEngineStatusFromRedis(conn.id)
      if (!redisStatus.isRunning) continue
      
      // Start the engine
      try {
        await coordinator.startEngine(conn.id, {
          connectionId: conn.id,
          connection_name: conn.name,
          exchange: conn.exchange,
          engine_type: "main",
          indicationInterval: settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5,
          strategyInterval: settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10,
          realtimeInterval: settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3,
        })
        console.log(`[v0] [LazyInit] Recovered engine for ${conn.name}`)
      } catch (err) {
        console.warn(`[v0] [LazyInit] Failed to recover engine for ${conn.name}:`, err)
      }
    }
  } catch (err) {
    console.warn("[v0] [LazyInit] Lazy initialization failed:", err)
  }
}

/**
 * Determine connection readiness state for progression display
 */
function getConnectionReadiness(conn: any): {
  canStart: boolean
  status: string
  missingFlags: string[]
} {
  const missingFlags: string[] = []
  
  const isInserted = conn.is_inserted === "1" || conn.is_inserted === 1 || conn.is_inserted === true
  const isDashboardEnabled = conn.is_enabled_dashboard === "1" || conn.is_enabled_dashboard === 1 || conn.is_enabled_dashboard === true
  const hasApiKey = (conn.api_key || conn.apiKey || "").length > 10
  const hasApiSecret = (conn.api_secret || conn.apiSecret || "").length > 10
  
  if (!isInserted) missingFlags.push("not_added_to_active")
  if (!isDashboardEnabled) missingFlags.push("not_enabled_on_dashboard")
  if (!hasApiKey) missingFlags.push("no_api_key")
  if (!hasApiSecret) missingFlags.push("no_api_secret")
  
  const canStart = isInserted && isDashboardEnabled && hasApiKey && hasApiSecret
  
  let status = "idle"
  if (canStart) status = "ready_to_start"
  if (missingFlags.length === 0) status = "configured"
  
  return { canStart, status, missingFlags }
}

export async function GET() {
  try {
    console.log("[v0] Fetching real-time trade engine progression data")
    await initRedis()
    
    // Lazy init: recover engines from Redis if they were running before cold start
    await lazyInitEngines()
    
    // Get ALL connections, not just active ones
    const allConnections = await getAllConnections()
    
    if (!Array.isArray(allConnections)) {
      return NextResponse.json({
        success: true,
        connections: [],
        totalConnections: 0,
        runningEngines: 0,
        timestamp: new Date().toISOString(),
      })
    }
    
    // Filter to connections that are either:
    // 1. Active and enabled (running engines)
    // 2. Have credentials (configured and can be started)
    // 3. Have engine state in Redis (were running before)
    // 4. Are visible in dashboard but still need lazy recovery
    const relevantConnections = allConnections.filter((conn) => {
      const isInserted = conn.is_inserted === "1" || conn.is_inserted === 1 || conn.is_inserted === true
      const isDashboardEnabled = conn.is_enabled_dashboard === "1" || conn.is_enabled_dashboard === 1 || conn.is_enabled_dashboard === true
      const hasCredentials = (conn.api_key || conn.apiKey || "").length > 10 && (conn.api_secret || conn.apiSecret || "").length > 10
      const hasAnyEngineHints = Boolean(conn.is_live_trade || conn.is_active || conn.is_enabled)
      return isInserted || isDashboardEnabled || hasCredentials || hasAnyEngineHints
    })
    
    console.log(`[v0] Processing ${relevantConnections.length} relevant connections out of ${allConnections.length} total`)
    
    // Get progression status for each connection
    const progressionData = await Promise.all(
      relevantConnections.map(async (conn) => {
        try {
          const readiness = getConnectionReadiness(conn)
          const observability = await getConnectionObservability(conn.id)
          const resilience = await assessAndRecoverConnectionFlow(conn.id)
          
          // Use Redis-based engine status (works across cold starts)
          const redisEngineStatus = await getEngineStatusFromRedis(conn.id)
          
          // Also try in-memory coordinator if available
          let inMemoryEngineStatus: any = null
          try {
            const { getGlobalTradeEngineCoordinator } = await import("@/lib/trade-engine")
            const coordinator = getGlobalTradeEngineCoordinator()
            inMemoryEngineStatus = await coordinator.getEngineStatus(conn.id)
          } catch {
            // In-memory not available, fall back to Redis
          }
          
          const isEngineRunning = redisEngineStatus.isRunning || inMemoryEngineStatus !== null
          
          // Get trade/position data only for running engines (skip for idle connections)
          let tradeCount = 0
          let pseudoCount = 0
          let progressionState = {
            cyclesCompleted: 0,
            successfulCycles: 0,
            failedCycles: 0,
            cycleSuccessRate: "0%",
            totalTrades: 0,
            successfulTrades: 0,
            totalProfit: 0,
            prehistoricCyclesCompleted: 0,
            lastUpdate: null as Date | null,
          }
          
          if (isEngineRunning || readiness.canStart) {
            const [trades, positions, progState] = await Promise.all([
              getConnectionTrades(conn.id),
              getConnectionPositions(conn.id),
              ProgressionStateManager.getProgressionState(conn.id),
            ])
            tradeCount = trades.length
            pseudoCount = positions.length
            progressionState = {
              cyclesCompleted: progState.cyclesCompleted || 0,
              successfulCycles: progState.successfulCycles || 0,
              failedCycles: progState.failedCycles || 0,
              cycleSuccessRate: String(progState.cycleSuccessRate || "0%"),
              totalTrades: progState.totalTrades || 0,
              successfulTrades: progState.successfulTrades || 0,
              totalProfit: progState.totalProfit || 0,
              prehistoricCyclesCompleted: progState.prehistoricCyclesCompleted || 0,
              lastUpdate: progState.lastUpdate || null,
            }
            if (!isEngineRunning && readiness.canStart) {
              progressionState = {
                ...progressionState,
                cyclesCompleted: Math.max(progressionState.cyclesCompleted, progState.cyclesCompleted || 0),
                prehistoricCyclesCompleted: Math.max(progressionState.prehistoricCyclesCompleted, progState.prehistoricCyclesCompleted || 0),
              }
            }
          }
          
          const engineState = observability.phases.realtime.isStale
            ? "interrupted"
            : isEngineRunning
              ? "running"
              : readiness.status
          const updatedAt = progressionState.lastUpdate?.toISOString?.() || null
          const prehistoricLoaded = observability.prehistoric.loaded || (progressionState.prehistoricCyclesCompleted || 0) > 0
          
          // Merge cycle metrics from Redis and in-memory
          const cycleMetrics = {
            indicationCycles: inMemoryEngineStatus?.indication_cycle_count || redisEngineStatus.indicationCycles || 0,
            strategyCycles: inMemoryEngineStatus?.strategy_cycle_count || redisEngineStatus.strategyCycles || 0,
            realtimeCycles: inMemoryEngineStatus?.realtime_cycle_count || redisEngineStatus.realtimeCycles || 0,
            lastCycleAt: inMemoryEngineStatus?.last_cycle_at || redisEngineStatus.lastCycleAt || null,
          }
          
          console.log(`[v0] ${conn.name}: ${engineState}, ${tradeCount} trades, ${pseudoCount} positions, running=${isEngineRunning}`)
          
          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            isEnabled: conn.is_enabled,
            isActive: conn.is_active,
            isLiveTrading: conn.is_live_trade,
            isEngineRunning,
            engineState,
            observability: {
              counts: observability.counts,
              logSummary: observability.logSummary,
              phases: observability.phases,
              recovery: resilience,
            },
            readiness,
            tradeCount,
            pseudoPositionCount: pseudoCount,
            prehistoricDataLoaded: prehistoricLoaded,
            lastUpdate: updatedAt,
            cycleMetrics,
            progression: {
              cyclesCompleted: progressionState.cyclesCompleted,
              successfulCycles: progressionState.successfulCycles,
              failedCycles: progressionState.failedCycles,
              cycleSuccessRate: progressionState.cycleSuccessRate,
              totalTrades: progressionState.totalTrades,
              successfulTrades: progressionState.successfulTrades,
              totalProfit: progressionState.totalProfit,
            },
            realTimeData: isEngineRunning || readiness.canStart,
          }
        } catch (err) {
          console.warn(`[v0] Failed to get progression for ${conn.id}:`, err)
          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            isEnabled: conn.is_enabled,
            isActive: conn.is_active,
            isLiveTrading: conn.is_live_trade,
            isEngineRunning: false,
            engineState: 'error',
            tradeCount: 0,
            pseudoPositionCount: 0,
            prehistoricDataLoaded: false,
            lastUpdate: null,
            cycleMetrics: null,
            error: err instanceof Error ? err.message : String(err),
            realTimeData: false,
          }
        }
      })
    )
    
    console.log(`[v0] Returned progression data for ${progressionData.length} connections`)
    return NextResponse.json({
      success: true,
      connections: progressionData,
      totalConnections: progressionData.length,
      runningEngines: progressionData.filter(c => c.isEngineRunning).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to fetch progression:", error)
    await SystemLogger.logError(error, "api", "GET /api/trade-engine/progression")
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch progression",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
