import { NextRequest, NextResponse } from "next/server"
import { getProgressManager, getAllProgressManagers } from "@/lib/engine-progress-manager"
import { getConnectionTrackingSnapshot, getSystemTrackingSnapshot } from "@/lib/dashboard-tracking"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connectionId")

    if (!connectionId) {
      // Return all progress managers
      const allManagers = getAllProgressManagers()
      const tracking = await getSystemTrackingSnapshot()
      const allProgress = Array.from(allManagers.entries()).map(([id, manager]) => ({
        connectionId: id,
        state: manager.getState(),
      }))
      const missingConnections = tracking.snapshots
        .filter(({ connection }) => !allManagers.has(connection.id))
        .map(({ connection, snapshot }) => ({
          connectionId: connection.id,
          state: {
            step: snapshot.progression.prehistoricPhaseActive ? "prehistoric" : "idle",
            progress: snapshot.progression.cyclesCompleted,
            indications: snapshot.counts.indications,
            strategies: snapshot.counts.strategies,
            positions: snapshot.counts.positions,
            trades: snapshot.counts.trades,
            lastUpdate: snapshot.progression.lastUpdate,
          },
        }))
      return NextResponse.json({ progress: [...allProgress, ...missingConnections] })
    }

    const manager = getProgressManager(connectionId)
    const state = manager.getState()
    const tracking = await getConnectionTrackingSnapshot(connectionId)

    return NextResponse.json({
      progress: {
        ...state,
        tracking: tracking.counts,
        progression: tracking.progression,
      },
    })
  } catch (error) {
    console.error("[EngineProgress] Error:", error)
    return NextResponse.json(
      { error: "Failed to get engine progress" },
      { status: 500 }
    )
  }
}
