import { NextResponse } from "next/server"
import { ensureDefaultExchangesExist } from "@/lib/default-exchanges-seeder"
import { initRedis, getAllConnections, getRedisClient, setSettings } from "@/lib/redis-db"
import { completeStartup } from "@/lib/startup-coordinator"
import { initializeTradeEngineAutoStart, isAutoStartInitialized } from "@/lib/trade-engine-auto-start"

let serverStartupComplete = false

function toBoolean(value: unknown): boolean {
  return value === true || value === "1" || value === "true"
}

export async function GET() {
  console.log("[v0] /api/init: System initialization starting...")

  try {
    if (!serverStartupComplete) {
      console.log("[v0] /api/init: Running complete startup sequence...")
      await completeStartup()
      serverStartupComplete = true
      console.log("[v0] /api/init: Startup sequence complete")
    }

    if (!isAutoStartInitialized()) {
      console.log("[v0] /api/init: Initializing auto-start...")
      await initializeTradeEngineAutoStart()
    }

    await initRedis()

    const seedResult = await ensureDefaultExchangesExist()
    if (!seedResult.success) {
      console.warn("[v0] /api/init: Warning - could not seed default exchanges:", seedResult.error)
    }

    const allConnections = await getAllConnections()
    const enabledConnections = allConnections?.filter((c) => toBoolean(c.is_enabled)) || []
    const predefinedConnections = allConnections?.filter((c) => toBoolean(c.is_predefined)) || []

    const client = getRedisClient()
    const globalState = await client.hgetall("trade_engine:global")

    console.log("[v0] /api/init: Found", allConnections?.length || 0, "connections,", enabledConnections.length, "enabled,", predefinedConnections.length, "predefined")

    return NextResponse.json({
      success: true,
      message: "System initialized successfully",
      initializedAt: new Date().toISOString(),
      connections: {
        total: allConnections?.length || 0,
        enabled: enabledConnections.length,
        predefined: predefinedConnections.length,
      },
      defaultExchangesSeeded: seedResult.success,
      globalEngineStatus: globalState?.status || "unknown",
      autoStartInitialized: isAutoStartInitialized(),
    })
  } catch (error) {
    console.error("[v0] /api/init: Failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System initialization failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}