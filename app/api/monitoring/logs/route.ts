import { type NextRequest, NextResponse } from "next/server"
import { initRedis, getRedisClient } from "@/lib/redis-db"
import { SystemLogger } from "@/lib/system-logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const level = searchParams.get("level") || undefined
    const category = searchParams.get("category") || undefined

    await initRedis()
    const client = getRedisClient()

    // Use SystemLogger's getLogs method which handles both list and set formats
    let logs: any[] = []
    if (category && category !== "all") {
      logs = await SystemLogger.getLogs(category, limit)
    } else {
      logs = await SystemLogger.getLogs(undefined, limit)
    }

    // Filter by level if specified
    if (level && level !== "all") {
      logs = logs.filter((log) => log.level === level)
    }

    // Calculate stats
    const stats = {
      total: logs.length,
      displayed: logs.length,
      byLevel: logs.reduce((acc: any, log: any) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      }, {}),
      byCategory: logs.reduce((acc: any, log: any) => {
        acc[log.category || "unknown"] = (acc[log.category || "unknown"] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ logs, stats })
  } catch (error) {
    console.error("[v0] Error fetching logs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch logs",
        details: error instanceof Error ? error.message : "Unknown error",
        logs: [],
        stats: { total: 0, displayed: 0, byLevel: {}, byCategory: {} },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { level, category, message, metadata } = await request.json()

    if (!level || !category || !message) {
      return NextResponse.json({ error: "Missing required fields: level, category, message" }, { status: 400 })
    }

    await initRedis()
    const client = getRedisClient()

    const logId = `log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
    const logEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: metadata ? JSON.stringify(metadata) : "",
    }

    // Store in Redis
    await client.hset(logId, logEntry)
    await client.sadd("logs:all", logId)
    await client.sadd(`logs:${category}`, logId)
    await client.expire(logId, 604800) // 7 days TTL

    return NextResponse.json({ success: true, logId })
  } catch (error) {
    console.error("[v0] Error creating log entry:", error)
    return NextResponse.json(
      {
        error: "Failed to create log entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
