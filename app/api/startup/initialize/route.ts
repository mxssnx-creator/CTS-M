import { NextResponse } from "next/server"
import { getAllConnections, initRedis, getRedisClient } from "@/lib/redis-db"
import { ensureDefaultExchangesExist } from "@/lib/default-exchanges-seeder"
import { completeStartup } from "@/lib/startup-coordinator"
import { initializeTradeEngineAutoStart, isAutoStartInitialized } from "@/lib/trade-engine-auto-start"

export const runtime = "nodejs"

let startupComplete = false

/**
 * Canonical startup initialization.
 * Ensures only canonical base connections exist and env credentials are injected.
 * NOW: Actually starts engines for connections with valid credentials.
 */
export async function POST() {
  try {
    if (!startupComplete) {
      console.log("[v0] [Startup API] Running complete startup sequence...")
      await completeStartup()
      startupComplete = true
      console.log("[v0] [Startup API] Startup sequence complete")
    }

    if (!isAutoStartInitialized()) {
      console.log("[v0] [Startup API] Initializing auto-start...")
      await initializeTradeEngineAutoStart()
    }

    await initRedis()
    const ensureResult = await ensureDefaultExchangesExist()
    const connections = await getAllConnections()

    const baseIds = ["bybit-x03", "bingx-x01", "pionex-x01", "orangex-x01"]
    const baseConnections = connections.filter((c: any) => baseIds.includes(c.id))
    const withCredentials = baseConnections.filter((c: any) => (c.api_key || "").length > 10 && (c.api_secret || "").length > 10).length

    const client = getRedisClient()
    const globalState = await client.hgetall("trade_engine:global")

    return NextResponse.json({
      success: true,
      message: "Startup initialization complete",
      ensureResult,
      summary: {
        totalConnections: connections.length,
        baseConnections: baseConnections.length,
        baseWithCredentials: withCredentials,
      },
      globalEngineStatus: globalState?.status || "unknown",
      autoStartInitialized: isAutoStartInitialized(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
