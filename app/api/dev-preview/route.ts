import { NextResponse } from "next/server"
import { initializeTradeEngineAutoStart } from "@/lib/trade-engine-auto-start"
import { initRedis } from "@/lib/redis-db"
import { logProgressionEvent } from "@/lib/engine-progression-logs"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    await initRedis()
    await initializeTradeEngineAutoStart()

    await logProgressionEvent("global", "dev_preview_ready", "info", "Dev preview bootstrap completed", {
      environment: process.env.NODE_ENV || "development",
      previewMode: true,
    })

    return NextResponse.json({
      success: true,
      previewMode: true,
      message: "Dev preview bootstrap completed",
      endpoints: [
        "/api/trade-engine/quick-start?symbol=BTCUSDT",
        "/api/system/fix-connections",
        "/api/trade-engine/auto-start",
      ],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      previewMode: true,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
