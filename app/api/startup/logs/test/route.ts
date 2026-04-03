import { NextResponse } from "next/server"
import { logProgressionEvent } from "@/lib/engine-progression-logs"

/**
 * POST /api/startup/logs/test
 * Add a test progression log entry for testing
 */
export async function POST() {
  try {
    const testEvent = `test_startup_event_${Date.now()}`
    const testDetails = {
      testId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    }

    await logProgressionEvent("startup", testEvent, "info", "Test startup progression event", testDetails)

    return NextResponse.json({
      success: true,
      message: "Test startup log added",
      event: testEvent,
      details: testDetails,
    })
  } catch (error) {
    console.error("[v0] [TestStartupLog] Error adding test log:", error)
    return NextResponse.json(
      { error: "Failed to add test startup log", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}