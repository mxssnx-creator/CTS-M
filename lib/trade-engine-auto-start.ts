/**
 * Trade Engine Auto-Start Service
 * Automatically starts trade engines for enabled connections via their toggles
 * 
 * Keeps engine lifecycle synchronized with current main-enabled connections.
 * Engines are user-controlled via dashboard toggles; monitor ensures
 * enabled connections are actually running when global coordinator is running.
 */

import { getGlobalTradeEngineCoordinator } from "./trade-engine"
import { getAllConnections, getRedisClient, initRedis, setSettings } from "./redis-db"
import { loadSettingsAsync } from "./settings-storage"
import { hasConnectionCredentials, isConnectionMainProcessing } from "./connection-state-utils"
import { logProgressionEvent } from "./engine-progression-logs"

let autoStartInitialized = false
let autoStartTimer: NodeJS.Timeout | null = null

export function isAutoStartInitialized(): boolean {
  return autoStartInitialized
}

/**
 * Initialize trade engine monitor for auto-recovery/synchronization.
 * NOW: Actually starts engines for valid connections instead of just monitoring.
 */
export async function initializeTradeEngineAutoStart(): Promise<void> {
  if (autoStartInitialized) {
    console.log("[v0] [Auto-Start] Already initialized, skipping")
    if (!autoStartTimer) {
      console.log("[v0] [Auto-Start] Monitor missing after init; restarting monitor")
      startConnectionMonitoring()
    }
    return
  }

  try {
    console.log("[v0] [Auto-Start] Starting trade engine auto-initialization...")
    await logProgressionEvent("auto-start", "auto_start_init", "info", "Starting trade engine auto-initialization", {})

    await initRedis()
    const client = getRedisClient()

    // Start engines for all connections with valid credentials
    const connections = await getAllConnections()
    if (Array.isArray(connections)) {
      const coordinator = getGlobalTradeEngineCoordinator()

      // Set global engine state to running
      await client.hset("trade_engine:global", {
        status: "running",
        started_at: new Date().toISOString(),
        auto_start: "true",
      })

      await logProgressionEvent("auto-start", "auto_start_global_state", "info", "Set global engine state to running", {})

      let startedCount = 0
      let skippedCount = 0
      let failedCount = 0

      for (const conn of connections) {
        const hasValidCredentials = hasConnectionCredentials(conn, 20, false)
        const isMainProcessing = isConnectionMainProcessing(conn)

        if (!hasValidCredentials) {
          skippedCount++
          await logProgressionEvent("auto-start", "auto_start_skip_no_creds", "info", `Skipping ${conn.id}: no valid credentials`, {
            connectionId: conn.id,
            exchange: conn.exchange
          })
          continue
        }

        // Enable connection for processing if not already
        if (!isMainProcessing) {
          await client.hset(`connection:${conn.id}`, {
            is_active_inserted: "1",
            is_enabled_dashboard: "1",
            is_active: "1",
            updated_at: new Date().toISOString(),
          })
          await logProgressionEvent("auto-start", "auto_start_enabled", "info", `Enabled connection ${conn.id} for processing`, {
            connectionId: conn.id,
            exchange: conn.exchange
          })
        } else {
          await logProgressionEvent("auto-start", "auto_start_already_enabled", "info", `Connection ${conn.id} already enabled for processing`, {
            connectionId: conn.id,
            exchange: conn.exchange
          })
        }

        try {
          await logProgressionEvent("auto-start", "auto_start_engine_starting", "info", `Starting engine for ${conn.id}`, {
            connectionId: conn.id,
            exchange: conn.exchange
          })

          await coordinator.startEngine(conn.id, {
            connectionId: conn.id,
            connection_name: conn.name,
            exchange: conn.exchange,
            indicationInterval: 1,
            strategyInterval: 1,
            realtimeInterval: 1,
          })
          startedCount++
          console.log(`[v0] [Auto-Start] ✓ Engine started for ${conn.id}`)

          await logProgressionEvent("auto-start", "auto_start_engine_started", "info", `Engine successfully started for ${conn.id}`, {
            connectionId: conn.id,
            exchange: conn.exchange
          })
        } catch (e) {
          console.error(`[v0] [Auto-Start] Failed to start engine for ${conn.id}:`, e)
          failedCount++

          await logProgressionEvent("auto-start", "auto_start_engine_failed", "error", `Failed to start engine for ${conn.id}: ${e instanceof Error ? e.message : String(e)}`, {
            connectionId: conn.id,
            exchange: conn.exchange,
            error: e instanceof Error ? e.message : String(e)
          })
        }
      }

      console.log(`[v0] [Auto-Start] Started ${startedCount} engine(s) for connections with valid credentials`)

      await logProgressionEvent("auto-start", "auto_start_complete", "info", `Auto-start complete: ${startedCount} started, ${skippedCount} skipped, ${failedCount} failed`, {
        enginesStarted: startedCount,
        enginesSkipped: skippedCount,
        enginesFailed: failedCount,
        totalConnections: connections.length
      })
    }

    console.log("[v0] [Auto-Start] Auto-initialization complete")
    autoStartInitialized = true
    startConnectionMonitoring()

    await logProgressionEvent("auto-start", "auto_start_monitor_started", "info", "Connection monitoring started", {})
  } catch (error) {
    console.error("[v0] [Auto-Start] Initialization failed:", error)
    await logProgressionEvent("auto-start", "auto_start_error", "error", `Auto-start initialization failed: ${error instanceof Error ? error.message : String(error)}`, {
      error: error instanceof Error ? error.message : String(error)
    })
    autoStartInitialized = true
    startConnectionMonitoring()
  }
}

/**
 * Monitor for connection changes and synchronize coordinator engine state.
 */
function startConnectionMonitoring(): void {
  if (autoStartTimer) {
    return
  }

  let lastEnabledCount = 0
  let lastEnabledSignature = ""
  let cachedSettings: any = null
  let settingsCacheTime = 0
  let monitorCycleInFlight = false
  const SETTINGS_CACHE_TTL = 60000 // 60 seconds

  autoStartTimer = setInterval(async () => {
    if (monitorCycleInFlight) {
      return
    }

    monitorCycleInFlight = true
    try {
      // Always check global engine status first
      await initRedis()
      const monClient = getRedisClient()
      const monGlobalState = await monClient.hgetall("trade_engine:global")
      if (monGlobalState?.status !== "running") {
        // Global engine not running - don't auto-start any connections
        return
      }
      
      const connections = await getAllConnections()

      // Ensure connections is an array before filtering
      if (!Array.isArray(connections)) {
        console.warn("[v0] [Monitor] Connections not array")
        return
      }

      // Filter for main-assigned + dashboard-enabled connections with valid API keys only.
      const enabledConnections = connections.filter((c) => {
        const isMainProcessing = isConnectionMainProcessing(c)
        const hasValidCredentials = hasConnectionCredentials(c, 20, false)
        return isMainProcessing && hasValidCredentials
      })

      const enabledSignature = enabledConnections
        .map((connection) => connection.id)
        .sort()
        .join(",")

      // If enabled connection set changed, log it (but don't auto-start)
      if (enabledSignature !== lastEnabledSignature) {
        console.log(`[v0] [Monitor] Enabled connections changed: ${lastEnabledCount} -> ${enabledConnections.length} (manual start required)`)
        lastEnabledCount = enabledConnections.length
        lastEnabledSignature = enabledSignature
      }

      // Load settings ONCE per interval, not per connection
      let settings = cachedSettings
      if (!settings || Date.now() - settingsCacheTime > SETTINGS_CACHE_TTL) {
        settings = await loadSettingsAsync()
        cachedSettings = settings
        settingsCacheTime = Date.now()
      }

      // Ensure coordinator engine map matches currently enabled+assigned connections.
      // This recovers from missed toggle events, service restarts, or stale state.
      try {
        const coordinator = getGlobalTradeEngineCoordinator()
        await coordinator.refreshEngines()
      } catch (syncError) {
        console.warn("[v0] [Monitor] Failed to refresh coordinator engines:", syncError)
      }
      
    } catch (error) {
      // Log but don't crash - gracefully handle Redis errors
      if (error instanceof Error && error.message.includes("Redis credentials")) {
        // Only log once per interval to avoid spam
        if (Math.random() < 0.1) {
          console.warn("[v0] [Monitor] Redis not configured - skipping auto-start check")
        }
      } else {
        console.warn("[v0] [Monitor] Error during connection monitoring:", error instanceof Error ? error.message : String(error))
      }
    } finally {
      monitorCycleInFlight = false
    }
  }, 10000) // Check every 10 seconds for new enabled connections

  autoStartTimer.unref?.()
}

/**
 * Stop the connection monitoring timer
 */
export function stopConnectionMonitoring(): void {
  if (autoStartTimer) {
    clearInterval(autoStartTimer)
    autoStartTimer = null
  }
}
