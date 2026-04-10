import { NextResponse } from "next/server"
import { buildStrategyStats } from "@/lib/dashboard-tracking"

export async function GET() {
  try {
    const stats = await buildStrategyStats()
    const strategies = [
      { name: "Base Strategy", type: "base", active: stats.base.count > 0, positions: stats.base.count, winRate: stats.base.winRate, profit: stats.base.profitFactor250, drawdown: stats.base.drawdown },
      { name: "Main Strategy", type: "main", active: stats.main.count > 0, positions: stats.main.count, winRate: stats.main.winRate, profit: stats.main.profitFactor250, drawdown: stats.main.drawdown },
      { name: "Real Strategy", type: "real", active: stats.real.count > 0, positions: stats.real.count, winRate: stats.real.winRate, profit: stats.real.profitFactor250, drawdown: stats.real.drawdown },
      { name: "Live Strategy", type: "live", active: stats.live.count > 0, positions: stats.live.count, winRate: stats.live.winRate, profit: stats.live.profitFactor250, drawdown: stats.live.drawdown },
    ]

    return NextResponse.json(strategies)
  } catch (error) {
    console.error("[v0] Error fetching strategies:", error)
    return NextResponse.json([], { status: 500 })
  }
}
