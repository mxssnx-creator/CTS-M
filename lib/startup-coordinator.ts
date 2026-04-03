/**
 * Startup Coordinator
 * PHASE 4 FIX: Clean startup sequence with auto-start for valid connections
 * 
 * Goals:
 * 1. Clear sequential startup
 * 2. Auto-start engines for connections with valid credentials
 * 3. Validation only - no data mutation unless necessary
 * 4. Clear logging of what happened
 */

import {
  initRedis,
  getAllConnections,
  getRedisClient,
  getSettings,
  setSettings,
  updateConnection,
} from "@/lib/redis-db"
import { hasConnectionCredentials, isConnectionMainProcessing } from "@/lib/connection-state-utils"
import { runMigrations } from "@/lib/redis-migrations"
import { validateDatabase } from "@/lib/database-validator"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { consolidateDatabase } from "@/lib/database-consolidation"
import { logProgressionEvent } from "@/lib/engine-progression-logs"

/**
 * PHASE 4 FIX 4.1: Clean up orphaned progress from incomplete shutdowns
 */
export async function cleanupOrphanedProgress() {
  try {
    const client = getRedisClient()

    console.log(`[v0] [Startup] Cleaning up orphaned progress...`)

    const allConnections = await getAllConnections()
    const coordinator = getGlobalTradeEngineCoordinator()

    let cleanedUp = 0

    for (const conn of allConnections) {
      const runningFlag = await getSettings(`engine_is_running:${conn.id}`)

      if (runningFlag === "true" || runningFlag === "1") {
        if (!coordinator.isEngineRunning(conn.id)) {
          console.log(`[v0] [Startup] Cleaning orphaned running flag for ${conn.id}`)

          await setSettings(`engine_is_running:${conn.id}`, "false")
          await setSettings(`engine_progression:${conn.id}`, {
            phase: "idle",
            progress: 0,
            detail: "Cleaned up after unclean shutdown",
            updated_at: new Date().toISOString(),
          })

          cleanedUp++
        }
      }
    }

    console.log(`[v0] [Startup] ✓ Cleaned up ${cleanedUp} orphaned progress flags`)
  } catch (error) {
    console.warn(`[v0] [Startup] Warning during cleanup: ${error}`)
  }
}

/**
 * PHASE 4 FIX 4.1: Complete startup sequence with auto-start for valid connections
 */
export async function completeStartup() {
  console.log(`[v0] [Startup] ========================================`)
  console.log(`[v0] [Startup] Beginning pre-startup sequence...`)
  console.log(`[v0] [Startup] ========================================\n`)

  try {
    console.log(`[v0] [Startup] Step 1/8: Initializing Redis...`)
    await logProgressionEvent("startup", "startup_redis_init", "info", "Initializing Redis database", {})
    await initRedis()
    console.log(`[v0] [Startup] ✓ Redis initialized\n`)
    await logProgressionEvent("startup", "startup_redis_complete", "info", "Redis initialization complete", {})

    console.log(`[v0] [Startup] Step 2/8: Running database migrations...`)
    await logProgressionEvent("startup", "startup_migrations_start", "info", "Running database migrations", {})
    const migResult = await runMigrations()
    console.log(`[v0] [Startup] ✓ Migrations complete (v${migResult.version})\n`)
    await logProgressionEvent("startup", "startup_migrations_complete", "info", `Database migrations complete (v${migResult.version})`, { version: migResult.version })

    console.log(`[v0] [Startup] Step 3/8: Validating database integrity...`)
    await logProgressionEvent("startup", "startup_validation_start", "info", "Validating database integrity", {})
    try {
      await validateDatabase()
      console.log(`[v0] [Startup] ✓ Database validation passed\n`)
      await logProgressionEvent("startup", "startup_validation_complete", "info", "Database validation passed", {})
    } catch (e) {
      console.warn(`[v0] [Startup] ⚠ Database validation warning: ${e}`)
      console.log(`[v0] [Startup] ✓ Continuing with warnings\n`)
      await logProgressionEvent("startup", "startup_validation_warning", "warning", `Database validation warning: ${e}`, { error: String(e) })
    }

    console.log(`[v0] [Startup] Step 4/8: Loading base connections...`)
    await logProgressionEvent("startup", "startup_connections_load", "info", "Loading base connections", {})
    const allConnections = await getAllConnections()
    console.log(`[v0] [Startup] ✓ Loaded ${allConnections.length} base connections\n`)
    await logProgressionEvent("startup", "startup_connections_loaded", "info", `Loaded ${allConnections.length} base connections`, { connectionCount: allConnections.length })

    console.log(`[v0] [Startup] Step 5/8: Consolidating database structures...`)
    await logProgressionEvent("startup", "startup_consolidation_start", "info", "Consolidating database structures", {})
    try {
      await consolidateDatabase()
      console.log(`[v0] [Startup] ✓ Database consolidation complete\n`)
      await logProgressionEvent("startup", "startup_consolidation_complete", "info", "Database consolidation complete", {})
    } catch (e) {
      console.warn(`[v0] [Startup] ⚠ Database consolidation warning: ${e}`)
      await logProgressionEvent("startup", "startup_consolidation_warning", "warning", `Database consolidation warning: ${e}`, { error: String(e) })
    }

    console.log(`[v0] [Startup] Step 6/8: Initializing engine coordinator...`)
    await logProgressionEvent("startup", "startup_coordinator_init", "info", "Initializing engine coordinator", {})
    const coordinator = getGlobalTradeEngineCoordinator()
    console.log(`[v0] [Startup] ✓ Engine coordinator initialized\n`)
    await logProgressionEvent("startup", "startup_coordinator_ready", "info", "Engine coordinator initialized", {})

    console.log(`[v0] [Startup] Step 7/8: Cleaning up orphaned state...`)
    await logProgressionEvent("startup", "startup_cleanup_start", "info", "Cleaning up orphaned progress state", {})
    await cleanupOrphanedProgress()
    console.log(`[v0] [Startup] ✓ Cleanup complete\n`)
    await logProgressionEvent("startup", "startup_cleanup_complete", "info", "Orphaned state cleanup complete", {})

    console.log(`[v0] [Startup] Step 8/8: Auto-starting engines for valid connections...`)
    await logProgressionEvent("startup", "startup_engine_autostart", "info", "Starting engines for valid connections", {})
    const startedCount = await autoStartValidConnections(coordinator, allConnections)
    console.log(`[v0] [Startup] ✓ Auto-started ${startedCount} engine(s)\n`)
    await logProgressionEvent("startup", "startup_engine_autostart_complete", "info", `Auto-started ${startedCount} engine(s) for connections with valid credentials`, { enginesStarted: startedCount })

    console.log(`[v0] [Startup] ========================================`)
    console.log(`[v0] [Startup] ✓ Pre-startup sequence complete`)
    console.log(`[v0] [Startup] ========================================`)
    console.log(`[v0] [Startup] Ready for user interaction`)
    console.log(`[v0] [Startup] ${startedCount} engine(s) running with valid credentials`)
    console.log(`[v0] [Startup] ========================================\n`)

    await logProgressionEvent("startup", "startup_complete", "info", "Startup sequence complete - system ready for user interaction", {
      enginesRunning: startedCount,
      totalConnections: allConnections.length,
      environment: process.env.NODE_ENV || "development"
    })

    // Force flush all logs to ensure startup logs are written immediately
    try {
      const { flushAllLogBuffers } = await import("@/lib/engine-progression-logs")
      await flushAllLogBuffers()
    } catch (e) {
      console.warn("[v0] [Startup] Could not force flush startup logs:", e)
    }
  } catch (error) {
    console.error(`[v0] [Startup] ✗ Fatal error during startup:`, error)
    await logProgressionEvent("startup", "startup_error", "error", "Fatal error during startup sequence", {
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV || "development"
    })
    throw error
  }
}

/**
 * Auto-start engines for connections that have valid credentials
 */
async function autoStartValidConnections(coordinator: any, allConnections: any[]): Promise<number> {
  let startedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const conn of allConnections) {
    const hasCreds = hasConnectionCredentials(conn, 20, false)
    if (!hasCreds) {
      console.log(`[v0] [Startup] Skipping ${conn.id}: no valid credentials`)
      skippedCount++
      continue
    }

    const isProcessing = isConnectionMainProcessing(conn)
    if (isProcessing) {
      console.log(`[v0] [Startup] ${conn.id}: already enabled for processing`)
      await logProgressionEvent("startup", "startup_engine_already_running", "info", `Engine already running for ${conn.id}`, {
        connectionId: conn.id,
        exchange: conn.exchange
      })
    } else {
      console.log(`[v0] [Startup] Enabling ${conn.id} for processing (has valid credentials)`)
      await updateConnection(conn.id, {
        is_active_inserted: "1",
        is_enabled_dashboard: "1",
        is_active: "1",
        updated_at: new Date().toISOString(),
      })
      await logProgressionEvent("startup", "startup_engine_enabled", "info", `Enabled connection ${conn.id} for processing`, {
        connectionId: conn.id,
        exchange: conn.exchange
      })
    }

    try {
      await logProgressionEvent("startup", "startup_engine_starting", "info", `Starting engine for ${conn.id}`, {
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
      console.log(`[v0] [Startup] ✓ Engine started for ${conn.id}`)

      await logProgressionEvent("startup", "startup_engine_started", "info", `Engine successfully started for ${conn.id}`, {
        connectionId: conn.id,
        exchange: conn.exchange
      })
    } catch (e) {
      console.error(`[v0] [Startup] Failed to start engine for ${conn.id}:`, e)
      failedCount++

      await logProgressionEvent("startup", "startup_engine_failed", "error", `Failed to start engine for ${conn.id}: ${e instanceof Error ? e.message : String(e)}`, {
        connectionId: conn.id,
        exchange: conn.exchange,
        error: e instanceof Error ? e.message : String(e)
      })
    }
  }

  await logProgressionEvent("startup", "startup_engine_summary", startedCount > 0 ? "info" : "warning", `Engine auto-start summary: ${startedCount} started, ${skippedCount} skipped, ${failedCount} failed`, {
    enginesStarted: startedCount,
    enginesSkipped: skippedCount,
    enginesFailed: failedCount,
    totalConnections: allConnections.length
  })

  return startedCount
}

/**
 * PHASE 4: Get startup status for diagnostics
 */
export async function getStartupStatus() {
  try {
    const client = getRedisClient()

    const redisReachable = await client.ping()
    const schemaVersion = await client.get("_schema_version")
    const connections = await getAllConnections()
    const migrationsRun = await client.get("_migrations_run")

    return {
      redis_reachable: redisReachable === "PONG",
      schema_version: schemaVersion,
      connections_count: connections.length,
      migrations_run: migrationsRun === "1",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      redis_reachable: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }
  }
}
