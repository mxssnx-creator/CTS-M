import { NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { buildStrategyStats } from "@/lib/dashboard-tracking"

export async function GET() {
  const startTime = Date.now()
  try {
    console.log("[v0] [API] [Strategies] Fetching strategies evaluation stats")
    
    const strategyStats = await buildStrategyStats()

    const duration = Date.now() - startTime
    console.log(`[v0] [API] [Strategies] Fetched in ${duration}ms - base: ${strategyStats.base.count}, main: ${strategyStats.main.count}, real: ${strategyStats.real.count}, live: ${strategyStats.live.count}`)

    return NextResponse.json({
      success: true,
      strategies: strategyStats,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[v0] [API] [Strategies] Failed to fetch strategies stats (${duration}ms):`, error)
    await SystemLogger.logError(error, "api", "GET /api/main/strategies-evaluation")
    return NextResponse.json({
      success: false,
      error: "Failed to fetch strategies stats",
      strategies: {
        base: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
        main: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
        real: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
        live: { count: 0, winRate: 0, drawdown: 0, drawdownHours: 0, profitFactor250: 0, profitFactor50: 0 },
      },
    })
  }
}
