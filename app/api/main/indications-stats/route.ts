import { NextResponse } from "next/server"
import { initRedis, getRedisClient } from "@/lib/redis-db"
import { SystemLogger } from "@/lib/system-logger"

export async function GET() {
  const startTime = Date.now()
  try {
    console.log("[v0] [API] [Indications] Fetching indications stats")
    
    await initRedis()
    const client = getRedisClient()

    const indicationKeys = await client.keys("indications:*")
    console.log(`[v0] [API] [Indications] Found ${indicationKeys.length} indication keys`)
    
    const indicationStats = {
      direction: { count: 0, avgSignalStrength: 0, lastTrigger: null as string | null, profitFactor: 0 },
      move: { count: 0, avgSignalStrength: 0, lastTrigger: null as string | null, profitFactor: 0 },
      active: { count: 0, avgSignalStrength: 0, lastTrigger: null as string | null, profitFactor: 0 },
      optimal: { count: 0, avgSignalStrength: 0, lastTrigger: null as string | null, profitFactor: 0 },
    }

    const indicationDataByType: Record<string, any[]> = {
      direction: [], move: [], active: [], optimal: []
    }

    for (const key of indicationKeys) {
      try {
        const indication = await client.get(key)
        if (!indication) continue

        const data = JSON.parse(indication)
        const type = data.type as "direction" | "move" | "active" | "optimal"

        if (indicationDataByType[type]) {
          indicationDataByType[type].push(data)
          indicationStats[type].count++

          if (!indicationStats[type].lastTrigger || new Date(data.timestamp) > new Date(indicationStats[type].lastTrigger!)) {
            indicationStats[type].lastTrigger = data.timestamp
          }
        }
      } catch (parseError) {
        console.warn(`[v0] [API] [Indications] Failed to parse indication key ${key}:`, parseError)
      }
    }

    Object.keys(indicationStats).forEach((type) => {
      const key = type as "direction" | "move" | "active" | "optimal"
      const indications = indicationDataByType[key]
      if (indications.length > 0) {
        const avgSignalStrength = indications.reduce((sum, s) => sum + (s.signal_strength || 0), 0) / indications.length
        const avgProfitFactor = indications.reduce((sum, s) => sum + (s.profit_factor || 1), 0) / indications.length
        
        indicationStats[key].avgSignalStrength = avgSignalStrength
        indicationStats[key].profitFactor = avgProfitFactor
      }
    })

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
