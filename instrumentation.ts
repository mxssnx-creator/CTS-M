export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  // Initialize production error handlers FIRST (before any other startup)
  try {
    const { default: ProductionErrorHandler } = await import("@/lib/error-handling-production")
    ProductionErrorHandler.initialize()
  } catch (error) {
    console.error("[ERROR_HANDLER] Failed to initialize production error handlers:", error)
  }

  // Initialize error handling integration (circuit breakers, metrics, etc.)
  try {
    const { initializeErrorHandling } = await import("@/lib/error-handling-integration")
    initializeErrorHandling()
  } catch (error) {
    console.error("[ERROR_INTEGRATION] Failed to initialize error handling integration:", error)
  }

  // Initialize comprehensive error handler
  try {
    const { ComprehensiveErrorHandler } = await import("@/lib/comprehensive-error-handler")
    ComprehensiveErrorHandler.initialize()
  } catch (error) {
    console.error("[COMPREHENSIVE_ERROR] Failed to initialize comprehensive error handler:", error)
  }

  // Initialize metrics collector
  try {
    const { initializeDefaultMetrics } = await import("@/lib/metrics-collector")
    initializeDefaultMetrics()
  } catch (error) {
    console.error("[METRICS] Failed to initialize default metrics:", error)
  }

  // Initialize system logger
  try {
    const { SystemLogger } = await import("@/lib/system-logger")
    await SystemLogger.logToDatabase({
      timestamp: new Date().toISOString(),
      level: "info",
      category: "system",
      message: "Server starting up - instrumentation initialized",
      metadata: { runtime: process.env.NEXT_RUNTIME, nodeVersion: process.version },
    })
  } catch (error) {
    console.error("[SYSTEM_LOGGER] Failed to log startup:", error)
  }

  // Initialize structured logging
  try {
    const { getLogger, LogCategory } = await import("@/lib/structured-logging")
    const systemLogger = getLogger(LogCategory.SYSTEM)
    systemLogger.info("Server startup complete", {
      runtime: process.env.NEXT_RUNTIME,
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("[STRUCTURED_LOGGER] Failed to initialize:", error)
  }

  // Initialize global error handlers for uncaught exceptions
  try {
    process.on("uncaughtException", async (error) => {
      console.error("[UNCAUGHT_EXCEPTION]", error)
      try {
        const { SystemLogger } = await import("@/lib/system-logger")
        await SystemLogger.logToDatabase({
          timestamp: new Date().toISOString(),
          level: "error",
          category: "uncaught-exception",
          message: error.message,
          metadata: { stack: error.stack },
        })
      } catch {
        // Ignore logging errors during uncaught exception
      }
    })

    process.on("unhandledRejection", async (reason, promise) => {
      console.error("[UNHANDLED_REJECTION]", reason)
      try {
        const { SystemLogger } = await import("@/lib/system-logger")
        await SystemLogger.logToDatabase({
          timestamp: new Date().toISOString(),
          level: "error",
          category: "unhandled-rejection",
          message: reason instanceof Error ? reason.message : String(reason),
          metadata: { stack: reason instanceof Error ? reason.stack : undefined },
        })
      } catch {
        // Ignore logging errors during unhandled rejection
      }
    })
  } catch (error) {
    console.error("[ERROR_HANDLERS] Failed to set up process error handlers:", error)
  }

  // Run full startup sequence: Redis init, migrations, connections with real credentials
  try {
    const { initRedis } = await import("@/lib/redis-db")
    const { runMigrations } = await import("@/lib/redis-migrations")
    const { completeStartup } = await import("@/lib/startup-coordinator")

    console.log("[v0] [Startup] Running full startup sequence via instrumentation...")

    // Step 1: Initialize Redis (in-memory)
    await initRedis()

    // Step 2: Run all database migrations (creates schema, seeds connections with real credentials)
    await runMigrations()

    // Step 3: Run full startup coordinator (validates, consolidates, auto-starts engines for valid connections)
    await completeStartup()

    console.log("[v0] [Startup] Full startup sequence complete - system ready")
  } catch (error) {
    console.error("[v0] [Startup] Fatal error during startup sequence:", error)
  }

  return
}
