import { NextResponse } from "next/server"
import { getProgressionLogs } from "@/lib/engine-progression-logs"
import { initRedis, getRedisClient } from "@/lib/redis-db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/startup/logs
 * Get startup progression logs
 */
export async function GET() {
  try {
    await initRedis()
    const client = getRedisClient()

    // Check if startup logs exist
    const logKey = "engine_logs:startup"
    const logCount = await client.llen(logKey)

    console.log(`[v0] [StartupLogs] Found ${logCount} startup log entries`)

    // Get startup progression logs
    const logs = await getProgressionLogs("startup")

    return NextResponse.json({
      count: logs.length,
      logs: logs.slice(0, 50), // Limit to last 50 entries for performance
      redisKey: logKey,
      totalInRedis: logCount,
    }, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error("[v0] [StartupLogs] Error fetching startup logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch startup logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/startup/logs
 * Clear startup progression logs
 */
export async function DELETE() {
  try {
    await initRedis()
    const client = getRedisClient()

    const logKey = "engine_logs:startup"
    const deletedCount = await client.del(logKey)

    console.log(`[v0] [StartupLogs] Cleared ${deletedCount} startup log entries`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} startup log entries`,
      deletedCount,
    })
  } catch (error) {
    console.error("[v0] [StartupLogs] Error clearing startup logs:", error)
    return NextResponse.json(
      { error: "Failed to clear startup logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}