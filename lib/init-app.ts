"use server"

/**
 * Application Initialization
 * Now Redis-based with automatic initialization on startup
 */

let initializationComplete = false
let initializationInFlight: Promise<{ success: boolean; message?: string; error?: string }> | null = null

export async function initializeApplication() {
  if (initializationComplete) {
    return { success: true, message: "Application already initialized" }
  }

  if (initializationInFlight) {
    return initializationInFlight
  }

  initializationInFlight = (async () => {
    try {
      console.log("[v0] Application initializing with Redis...")

      // Initialize Redis with migrations
      const { initRedis } = await import("@/lib/redis-db")
      const { runMigrations } = await import("@/lib/redis-migrations")

      await initRedis()
      await runMigrations()

      initializationComplete = true
      console.log("[v0] Application initialized successfully")

      return { success: true, message: "Application initialized" }
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      return { success: false, error: String(error) }
    } finally {
      initializationInFlight = null
    }
  })()

  return initializationInFlight
}

export async function resetInitialization() {
  initializationComplete = false
}
