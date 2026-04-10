import { NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { buildIndicationStats } from "@/lib/dashboard-tracking"

export async function GET() {
  const startTime = Date.now()
  try {
    console.log("[v0] [API] [Indications] Fetching indications stats")
    
    const indicationStats = await buildIndicationStats()

    const duration = Date.now() - startTime
    console.log(`[v0] [API] [Indications] Fetched in ${duration}ms - direction: ${indicationStats.direction.count}, move: ${indicationStats.move.count}, active: ${indicationStats.active.count}, optimal: ${indicationStats.optimal.count}`)

    return NextResponse.json({
      success: true,
      indications: indicationStats,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[v0] [API] [Indications] Failed to fetch indications stats (${duration}ms):`, error)
    await SystemLogger.logError(error, "api", "GET /api/main/indications-stats")
    return NextResponse.json({
      success: false,
      error: "Failed to fetch indications stats",
      indications: {
        direction: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
        move: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
        active: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
        optimal: { count: 0, avgSignalStrength: 0, lastTrigger: null, profitFactor: 0 },
      },
    })
  }
}
