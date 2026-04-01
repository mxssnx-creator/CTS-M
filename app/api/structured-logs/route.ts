import { NextResponse } from "next/server"
import { getLogger, LogCategory, LogLevel, getAllLogs, exportAllLogs } from "@/lib/structured-logging"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get("format") || "json"
    const category = url.searchParams.get("category")
    const level = url.searchParams.get("level")
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")
    const source = url.searchParams.get("source")

    if (source === "redis") {
      const loggerInstance = getLogger(LogCategory.SYSTEM)
      const redisLogs = await loggerInstance.getRedisLogs({
        category: category ? LogCategory[category as keyof typeof LogCategory] : undefined,
        limit,
        level: level ? LogLevel[level.toUpperCase() as keyof typeof LogLevel] : undefined,
      })

      return NextResponse.json({
        success: true,
        source: "redis",
        logs: redisLogs,
        count: redisLogs.length,
      })
    }

    let logs = getAllLogs()

    if (category) {
      const cat = LogCategory[category.toUpperCase() as keyof typeof LogCategory]
      if (cat) {
        logs = logs.filter((l) => l.category === cat)
      }
    }

    if (level) {
      const lvl = LogLevel[level.toUpperCase() as keyof typeof LogLevel]
      if (lvl !== undefined) {
        logs = logs.filter((l) => l.level >= lvl)
      }
    }

    logs = logs.slice(-limit)

    if (format === "csv") {
      const csv = exportAllLogs("csv")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="structured-logs-${new Date().toISOString()}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      source: "memory",
      logs,
      count: logs.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch structured logs",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, level, message, context, error } = body

    if (!category || !message) {
      return NextResponse.json(
        { error: "Missing required fields: category, message" },
        { status: 400 },
      )
    }

    const logCategory = LogCategory[category.toUpperCase() as keyof typeof LogCategory] || LogCategory.SYSTEM
    const logLevel = LogLevel[level?.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO

    const logger = getLogger(logCategory)

    if (logLevel === LogLevel.DEBUG) {
      await logger.debug(message, context)
    } else if (logLevel === LogLevel.WARN) {
      await logger.warn(message, context, error ? new Error(error) : undefined)
    } else if (logLevel === LogLevel.ERROR) {
      await logger.error(message, error ? new Error(error) : undefined, context)
    } else if (logLevel === LogLevel.CRITICAL) {
      await logger.critical(message, error ? new Error(error) : undefined, context)
    } else {
      await logger.info(message, context)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create log entry",
      },
      { status: 500 },
    )
  }
}
