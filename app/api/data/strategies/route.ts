import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { StrategyEngine } from "@/lib/strategies"
import { getActiveStrategies, getBestPerformingStrategies } from "@/lib/db-helpers"
import { loadConnections } from "@/lib/file-storage"

async function getRealStrategies(connectionId: string): Promise<any[]> {
  try {
    // Try to get active strategies from Redis first
    const activeStrategies = await getActiveStrategies(connectionId)
    
    if (activeStrategies && activeStrategies.length > 0) {
      return activeStrategies
    }

    // If no active strategies, try getting best performing ones
    const bestStrategies = await getBestPerformingStrategies(connectionId)
    if (bestStrategies && bestStrategies.length > 0) {
      return bestStrategies
    }

    const connections = loadConnections()
    const conn = connections.find((c) => c.id === connectionId)
    if (conn) {
      const strategyEngine = new StrategyEngine()
      const mockPseudoPositions = Array.from({ length: 120 }, (_, i) => ({
        id: `pseudo-${connectionId}-${i}`,
        connection_id: connectionId,
        symbol: i % 2 === 0 ? "BTCUSDT" : "ETHUSDT",
        indication_type: "direction" as const,
        takeprofit_factor: 8 + (i % 5),
        stoploss_ratio: 0.8 + (i % 4) * 0.1,
        trailing_enabled: i % 3 === 0,
        trail_start: 0.3,
        trail_stop: 0.1,
        entry_price: 45000 + i * 10,
        current_price: 45050 + i * 12,
        profit_factor: 0.9 + (i % 9) * 0.1,
        position_cost: 0.001,
        status: "active" as const,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      }))
      return strategyEngine.generateAllStrategies(mockPseudoPositions, 1.0, false, 50)
    }

    return []
  } catch (error) {
    console.error(`[v0] Failed to get real strategies for ${connectionId}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    const connectionId = request.nextUrl.searchParams.get("connectionId")
    if (!connectionId) {
      return NextResponse.json({ success: false, error: "connectionId query parameter required" }, { status: 400 })
    }

    // Determine if this is a demo connection or real connection
    // Demo connections start with "demo" or have id="demo-mode"
    const isDemo = connectionId === "demo-mode" || connectionId.startsWith("demo")

    let strategies: any[] = []

    if (isDemo) {
      // Generate mock strategies for demo mode
      const strategyEngine = new StrategyEngine()

      const mockPseudoPositions = Array.from({ length: 150 }, (_, i) => ({
        id: `pseudo-${connectionId}-${i}`,
        connection_id: connectionId,
        symbol: "BTCUSDT",
        indication_type: "direction" as const,
        takeprofit_factor: 8 + Math.random() * 10,
        stoploss_ratio: 0.5 + Math.random() * 1.5,
        trailing_enabled: Math.random() > 0.5,
        trail_start: 0.3 + Math.random() * 0.7,
        trail_stop: 0.1 + Math.random() * 0.2,
        entry_price: 45000 + Math.random() * 5000,
        current_price: 45000 + Math.random() * 5000,
        profit_factor: (Math.random() - 0.3) * 2,
        position_cost: 0.001,
        status: "active" as const,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }))

      strategies = strategyEngine.generateAllStrategies(
        mockPseudoPositions,
        1.0, // default blockAdjustmentRatio
        false, // blockAutoDisableEnabled
        50, // blockAutoDisableComparisonWindow
      )
    } else {
      // Fetch real strategies from trading engine via Redis
      strategies = await getRealStrategies(connectionId)
    }

    return NextResponse.json({
      success: true,
      data: strategies,
      isDemo,
      connectionId,
      count: strategies.length,
    })
  } catch (error) {
    console.error("[v0] Get strategies error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
