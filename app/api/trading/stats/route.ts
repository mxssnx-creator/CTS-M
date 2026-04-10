import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { query } from "@/lib/db"
import { getConnectionTrades, getConnectionPositions, initRedis } from "@/lib/redis-db"

export async function GET() {
  const startTime = Date.now()
  try {
    console.log("[v0] [API] [Trading Stats] Fetching detailed trading statistics")
    
    const connections = loadConnections()
    const enabledConnections = connections.filter((c) => c.is_enabled && c.is_live_trade)
    console.log(`[v0] [API] [Trading Stats] Enabled connections: ${enabledConnections.length}`)

    await initRedis()
    
    try {
      const last250Result = await query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses,
          COALESCE(CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0), 0) as winRate,
          COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) / NULLIF(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END), 0), 0) as profitFactor,
          COALESCE(SUM(pnl), 0) as totalProfit
         FROM (SELECT * FROM pseudo_positions ORDER BY created_at DESC LIMIT 250)`
      )
      
      const last50Result = await query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses,
          COALESCE(CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0), 0) as winRate,
          COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) / NULLIF(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END), 0), 0) as profitFactor,
          COALESCE(SUM(pnl), 0) as totalProfit
         FROM (SELECT * FROM pseudo_positions ORDER BY created_at DESC LIMIT 50)`
      )
      
      const last32hResult = await query(
        `SELECT 
          COUNT(*) as total,
          COALESCE(SUM(pnl), 0) as totalProfit,
          COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) / NULLIF(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END), 0), 0) as profitFactor
         FROM pseudo_positions WHERE created_at >= datetime('now', '-32 hours')`
      )
      
      const l250 = (last250Result as any[])[0] || {}
      const l50 = (last50Result as any[])[0] || {}
      const l32 = (last32hResult as any[])[0] || {}
      
      const duration = Date.now() - startTime
      console.log(`[v0] [API] [Trading Stats] Stats fetched in ${duration}ms - Last250: ${l250?.total || 0}, Last50: ${l50?.total || 0}, Last32h: ${l32?.total || 0}`)
      
      const tradeStats = await Promise.all(
        enabledConnections.map(async (connection) => {
          const [trades, positions] = await Promise.all([
            getConnectionTrades(connection.id),
            getConnectionPositions(connection.id),
          ])
          return { connectionId: connection.id, trades, positions }
        }),
      )

      const aggregatedTrades = tradeStats.flatMap((item) => item.trades)
      const aggregatedPositions = tradeStats.flatMap((item) => item.positions)

      return NextResponse.json({
        last250: {
          total: Number(l250?.total) || 0,
          wins: Number(l250?.wins) || 0,
          losses: Number(l250?.losses) || 0,
          winRate: Number(l250?.winRate) || 0,
          profitFactor: Number(l250?.profitFactor) || 0,
          totalProfit: Number(l250?.totalProfit) || 0,
        },
        last50: {
          total: Number(l50?.total) || 0,
          wins: Number(l50?.wins) || 0,
          losses: Number(l50?.losses) || 0,
          winRate: Number(l50?.winRate) || 0,
          profitFactor: Number(l50?.profitFactor) || 0,
          totalProfit: Number(l50?.totalProfit) || 0,
        },
        last32h: {
          total: Number(l32?.total) || 0,
          totalProfit: Number(l32?.totalProfit) || 0,
          profitFactor: Number(l32?.profitFactor) || 0,
        },
        liveData: {
          enabledConnections: enabledConnections.length,
          trades: aggregatedTrades.length,
          positions: aggregatedPositions.length,
          totalProfit: aggregatedPositions.reduce((sum, position) => sum + (Number(position.pnl || position.profit || 0) || 0), 0),
          avgProfitFactor: aggregatedPositions.length > 0
            ? aggregatedPositions.reduce((sum, position) => sum + (Number(position.profit_factor || 0) || 0), 0) / aggregatedPositions.length
            : 0,
          avgDrawdownTime: aggregatedPositions.length > 0
            ? aggregatedPositions.reduce((sum, position) => sum + (Number(position.drawdown_time || 0) || 0), 0) / aggregatedPositions.length
            : 0,
        },
      })
    } catch (dbError) {
      console.warn("[v0] [API] [Trading Stats] Database stats not available:", dbError)
      return NextResponse.json({
        last250: { total: 0, wins: 0, losses: 0, winRate: 0, profitFactor: 0, totalProfit: 0 },
        last50: { total: 0, wins: 0, losses: 0, winRate: 0, profitFactor: 0, totalProfit: 0 },
        last32h: { total: 0, totalProfit: 0, profitFactor: 0 },
      })
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[v0] [API] [Trading Stats] Failed to fetch stats (${duration}ms):`, error)
    await SystemLogger.logError(error, "api", "GET /api/trading/stats")
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
