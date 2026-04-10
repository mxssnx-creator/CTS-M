/**
 * Database Helper Functions - Redis Implementation
 * Provides utilities for working with indications and strategies in Redis
 */

import { getRedisClient } from "@/lib/redis-db"

async function getConnectionStrategySetEntries(connectionId: string): Promise<any[]> {
  const client = getRedisClient()
  const keys = await client.keys(`strategy_set:${connectionId}:*`).catch(() => [] as string[])
  const relevantKeys = keys.filter((key) => !key.endsWith(":stats"))

  const rawSets = await Promise.all(
    relevantKeys.map(async (key) => {
      const data = await client.get(key)
      if (!data) return []
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed.map((entry: any) => ({
          id: entry.id,
          connection_id: connectionId,
          symbol: key.split(":")[2] || entry.symbol || "UNKNOWN",
          stage: key.split(":").pop() || entry.strategyType || "unknown",
          profit_factor: Number(entry.profitFactor || 0),
          win_rate: Number(entry.confidence || 0),
          ...entry,
        })) : []
      } catch {
        return []
      }
    }),
  )

  return rawSets.flat()
}

async function getConnectionIndicationSetEntries(connectionId: string): Promise<any[]> {
  const client = getRedisClient()
  const keys = await client.keys(`indication_set:${connectionId}:*`).catch(() => [] as string[])
  const rawSets = await Promise.all(
    keys.map(async (key) => {
      const data = await client.get(key)
      if (!data) return []
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed.map((entry: any) => ({
          id: entry.id,
          connection_id: connectionId,
          symbol: key.split(":")[2] || entry.symbol || "UNKNOWN",
          indication_type: key.split(":")[3] || entry.type || "unknown",
          profit_factor: Number(entry.profitFactor || 0),
          confidence: Number(entry.confidence || 0),
          direction: entry.direction || "NEUTRAL",
          timestamp: entry.timestamp || new Date().toISOString(),
          ...entry,
        })) : []
      } catch {
        return []
      }
    }),
  )

  return rawSets.flat()
}

// =============================================================================
// INDICATION QUERIES
// =============================================================================

/**
 * Get active indications for a connection and symbol (Redis)
 */
export async function getActiveIndications(
  connectionId?: string,
  symbol?: string,
) {
  const client = getRedisClient()
  
  try {
    let ids: string[] = []
    
    if (symbol) {
      ids = await client.smembers(`indications:${symbol}`)
    } else if (connectionId) {
      ids = await client.smembers(`indications:${connectionId}`)
    } else {
      ids = await client.smembers("indications:all")
    }
    
    const indications = await Promise.all(
      ids.map(async (id) => {
        const data = await client.hgetall(`indication:${id}`)
        if (data && Object.keys(data).length > 0) {
          return {
            id,
            ...data,
            profit_factor: parseFloat(data.profit_factor) || 0,
            confidence: parseFloat(data.confidence) || 0,
          }
        }
        return null
      })
    )
    
    const filtered = indications.filter(Boolean)
    
    // Filter by connection if needed
    if (connectionId && !symbol) {
      const scoped = filtered.filter((ind: any) => ind.connection_id === connectionId)
      if (scoped.length > 0) return scoped
      return getConnectionIndicationSetEntries(connectionId)
    }
    
    if (filtered.length > 0) return filtered
    if (connectionId) return getConnectionIndicationSetEntries(connectionId)
    return filtered
  } catch (error) {
    console.error("[v0] [DB-Helpers] Error getting active indications:", error)
    return []
  }
}

/**
 * Get best performing indications for a connection
 */
export async function getBestPerformingIndications(
  connectionId: string,
  limit: number = 10,
) {
  const indications = await getActiveIndications(connectionId)
  return indications
    .sort((a: any, b: any) => (b.profit_factor || 0) - (a.profit_factor || 0))
    .slice(0, limit)
}

/**
 * Get recent indications within time window
 */
export async function getRecentIndications(
  connectionId: string,
  minutes: number = 60,
) {
  const indications = await getActiveIndications(connectionId)
  const cutoffTime = Date.now() - (minutes * 60 * 1000)
  
  return indications.filter((ind: any) => {
    const calculatedAt = new Date(ind.calculated_at).getTime()
    return calculatedAt > cutoffTime
  })
}

// =============================================================================
// STRATEGY QUERIES
// =============================================================================

/**
 * Get active strategies for a connection and symbol (Redis)
 */
export async function getActiveStrategies(
  connectionId?: string,
  symbol?: string,
) {
  const client = getRedisClient()
  
  try {
    let ids: string[] = []
    
    if (symbol) {
      ids = await client.smembers(`strategies:${symbol}`)
    } else if (connectionId) {
      ids = await client.smembers(`strategies:${connectionId}`)
    } else {
      ids = await client.smembers("strategies:all")
    }
    
    const strategies = await Promise.all(
      ids.map(async (id) => {
        const data = await client.hgetall(`strategy:${id}`)
        if (data && Object.keys(data).length > 0) {
          return {
            id,
            ...data,
            profit_factor: parseFloat(data.profit_factor) || 0,
            win_rate: parseFloat(data.win_rate) || 0,
          }
        }
        return null
      })
    )
    
    const filtered = strategies.filter(Boolean)
    
    // Filter by connection if needed
    if (connectionId && !symbol) {
      const scoped = filtered.filter((strat: any) => strat.connection_id === connectionId)
      if (scoped.length > 0) return scoped
      return getConnectionStrategySetEntries(connectionId)
    }
    
    if (filtered.length > 0) return filtered
    if (connectionId) return getConnectionStrategySetEntries(connectionId)
    return filtered
  } catch (error) {
    console.error("[v0] [DB-Helpers] Error getting active strategies:", error)
    return []
  }
}

/**
 * Get best performing strategies
 */
export async function getBestPerformingStrategies(
  connectionId: string,
  limit: number = 10,
) {
  const strategies = await getActiveStrategies(connectionId)
  return strategies
    .sort((a: any, b: any) => (b.profit_factor || 0) - (a.profit_factor || 0))
    .slice(0, limit)
}

/**
 * Get strategy performance statistics
 */
export async function getStrategyStatistics(connectionId: string) {
  const strategies = await getActiveStrategies(connectionId)
  
  const totalStrategies = strategies.length
  const avgProfitFactor = strategies.reduce((sum: number, s: any) => sum + (s.profit_factor || 0), 0) / (totalStrategies || 1)
  const avgWinRate = strategies.reduce((sum: number, s: any) => sum + (s.win_rate || 0), 0) / (totalStrategies || 1)
  
  return [{
    total_strategies: totalStrategies,
    avg_profit_factor: avgProfitFactor,
    avg_win_rate: avgWinRate,
  }]
}

// =============================================================================
// POSITION QUERIES (Redis)
// =============================================================================

/**
 * Get all positions from Redis
 */
export async function getAllPositions(connectionId?: string) {
  const client = getRedisClient()
  
  try {
    let ids: string[] = []
    
    if (connectionId) {
      ids = await client.smembers(`positions:${connectionId}`)
    } else {
      ids = await client.smembers("positions:all")
    }
    
    const positions = await Promise.all(
      ids.map(async (id) => {
        const data = await client.hgetall(`position:${id}`)
        if (data && Object.keys(data).length > 0) {
          return {
            id,
            ...data,
            entry_price: parseFloat(data.entry_price) || 0,
            exit_price: parseFloat(data.exit_price) || 0,
            quantity: parseFloat(data.quantity) || 0,
            realized_pnl: parseFloat(data.realized_pnl) || 0,
            unrealized_pnl: parseFloat(data.unrealized_pnl) || 0,
          }
        }
        return null
      })
    )
    
    return positions.filter(Boolean)
  } catch (error) {
    console.error("[v0] [DB-Helpers] Error getting positions:", error)
    return []
  }
}

// =============================================================================
// REDIS STATS
// =============================================================================

/**
 * Get Redis stats wrapper
 */
export async function getRedisStats() {
  const { getRedisStats: getStats } = await import("@/lib/redis-db")
  return getStats()
}

// =============================================================================
// CROSS-TABLE QUERIES (Redis-compatible)
// =============================================================================

/**
 * Get comprehensive performance summary across all indications
 */
export async function getAllIndicationPerformance(connectionId: string) {
  const indications = await getActiveIndications(connectionId)
  return indications
    .sort((a: any, b: any) => (b.profit_factor || 0) - (a.profit_factor || 0))
}

/**
 * Get comprehensive performance summary across all strategies
 */
export async function getAllStrategyPerformance(connectionId: string) {
  const strategies = await getActiveStrategies(connectionId)
  return strategies
    .sort((a: any, b: any) => (b.profit_factor || 0) - (a.profit_factor || 0))
}

/**
 * Get daily performance summary
 */
export async function getDailyPerformanceSummary(connectionId: string, days: number = 7) {
  const positions = await getAllPositions(connectionId)
  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000)
  
  return positions
    .filter((pos: any) => {
      const closedAt = pos.closed_at ? new Date(pos.closed_at).getTime() : 0
      return closedAt > cutoffDate
    })
    .sort((a: any, b: any) => {
      const aTime = new Date(a.closed_at || 0).getTime()
      const bTime = new Date(b.closed_at || 0).getTime()
      return bTime - aTime
    })
}

// Export helper to get Redis client wrapper
export async function getRedisHelpers() {
  return {
    getActiveIndications,
    getBestPerformingIndications,
    getRecentIndications,
    getActiveStrategies,
    getBestPerformingStrategies,
    getStrategyStatistics,
    getAllPositions,
    getRedisStats,
    getAllIndicationPerformance,
    getAllStrategyPerformance,
    getDailyPerformanceSummary,
  }
}
