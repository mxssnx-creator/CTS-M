import { getConnection, getSettings, setSettings } from "@/lib/redis-db"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { loadSettingsAsync } from "@/lib/settings-storage"

const INTERRUPTION_WINDOW_MS = 90_000
const RECOVERY_COOLDOWN_MS = 60_000

function toTimestamp(value: unknown): number | null {
  if (!value) return null
  const timestamp = new Date(String(value)).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function isEnabledFlag(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1"
}

export async function assessAndRecoverConnectionFlow(connectionId: string) {
  const [connection, engineState, progression] = await Promise.all([
    getConnection(connectionId),
    getSettings(`trade_engine_state:${connectionId}`),
    getSettings(`engine_progression:${connectionId}`),
  ])

  const lastActivity = [
    toTimestamp((engineState as any)?.last_realtime_run),
    toTimestamp((engineState as any)?.last_strategy_run),
    toTimestamp((engineState as any)?.last_indication_run),
    toTimestamp((engineState as any)?.updated_at),
  ]
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a)[0] ?? null

  const now = Date.now()
  const stale = lastActivity !== null && now - lastActivity > INTERRUPTION_WINDOW_MS
  const runningFlag = isEnabledFlag((engineState as any)?.status === "running") || isEnabledFlag(await getSettings(`engine_is_running:${connectionId}`))
  const eligible = Boolean(connection) &&
    isEnabledFlag(connection?.is_enabled) &&
    (isEnabledFlag(connection?.is_inserted) || isEnabledFlag(connection?.is_active_inserted)) &&
    isEnabledFlag(connection?.is_enabled_dashboard) &&
    String(connection?.api_key || "").length > 5 &&
    String(connection?.api_secret || "").length > 5

  let recovered = false
  let recoveryReason: string | null = null

  if (eligible && stale && runningFlag) {
    const requestedAt = toTimestamp((engineState as any)?.auto_recovery_requested_at)
    const cooldownExpired = requestedAt === null || now - requestedAt > RECOVERY_COOLDOWN_MS

    if (cooldownExpired) {
      const coordinator = getGlobalTradeEngineCoordinator()
      const settings = await loadSettingsAsync()
      await setSettings(`trade_engine_state:${connectionId}`, {
        ...(engineState || {}),
        auto_recovery_requested_at: new Date(now).toISOString(),
        interruption_detected_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      })

      try {
        if (!coordinator.isEngineRunning(connectionId)) {
          await coordinator.startEngine(connectionId, {
            connectionId,
            connection_name: connection?.name,
            exchange: connection?.exchange,
            indicationInterval: settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5,
            strategyInterval: settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10,
            realtimeInterval: settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3,
          })
        }

        await setSettings(`engine_progression:${connectionId}`, {
          ...(progression || {}),
          phase: "recovering",
          progress: 40,
          detail: "Automatic recovery started after stalled realtime activity",
          updated_at: new Date(now).toISOString(),
        })
        recovered = true
        recoveryReason = "stale realtime activity detected"
      } catch (error) {
        recoveryReason = error instanceof Error ? error.message : String(error)
      }
    }
  }

  return {
    eligible,
    stale,
    recovered,
    recoveryReason,
    lastActivityAt: lastActivity !== null ? new Date(lastActivity).toISOString() : null,
  }
}
