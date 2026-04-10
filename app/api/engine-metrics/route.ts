import { NextRequest, NextResponse } from "next/server"
import { getProgressManager } from "@/lib/engine-progress-manager"
import { IndicationEvaluator } from "@/lib/indication-evaluator"
import { StrategyEvaluator } from "@/lib/strategy-evaluator"
import { MetricsAggregator } from "@/lib/metrics-aggregator"
import { getEngineLogger } from "@/lib/engine-logger"
import { loadConnections } from "@/lib/file-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connectionId")

    const resolvedConnectionId = connectionId || loadConnections().find((c: any) => c.is_enabled || c.is_active || c.is_enabled_dashboard || c.is_live_trade)?.id || "demo-mode"

    const progressManager = getProgressManager(resolvedConnectionId)
    const logger = getEngineLogger(resolvedConnectionId)
    
    // Create evaluators (in real implementation, these would be shared instances)
    const indicationEvaluator = new IndicationEvaluator(resolvedConnectionId)
    const strategyEvaluator = new StrategyEvaluator(resolvedConnectionId)
    const metricsAggregator = new MetricsAggregator(resolvedConnectionId, indicationEvaluator, strategyEvaluator, logger)

    const uiMetrics = await metricsAggregator.getUIMetrics()

    return NextResponse.json({ metrics: uiMetrics, connectionId: resolvedConnectionId, fallbackUsed: !connectionId })
  } catch (error) {
    console.error("[EngineMetrics] Error:", error)
    return NextResponse.json(
      { error: "Failed to get engine metrics" },
      { status: 500 }
    )
  }
}
