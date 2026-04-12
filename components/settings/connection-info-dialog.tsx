"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { toast } from "@/lib/simple-toast"

interface ConnectionInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  connectionName: string
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function ConnectionInfoDialog({ open, onOpenChange, connectionId, connectionName }: ConnectionInfoDialogProps) {
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    if (open) {
      loadInfo()
    }
  }, [open, connectionId])

  const loadInfo = async () => {
    try {
      setLoading(true)

      const [indicationsRes, settingsRes, presetTypeRes] = await Promise.all([
        fetch(`/api/settings/connections/${connectionId}/active-indications`),
        fetch(`/api/settings/connections/${connectionId}/settings`),
        fetch(`/api/settings/connections/${connectionId}/preset-type`),
      ])
      const [progressionRes, strategiesRes, positionsRes] = await Promise.all([
        fetch(`/api/connections/progression/${connectionId}/logs`),
        fetch(`/api/data/strategies?connectionId=${connectionId}`),
        fetch(`/api/positions/${connectionId}`),
      ])
      const observabilityRes = await fetch(`/api/trade-engine/status?connectionId=${connectionId}`)

      const indications = indicationsRes.ok ? await indicationsRes.json() : {}
      const settings = settingsRes.ok ? await settingsRes.json() : {}
      const presetType = presetTypeRes.ok ? await presetTypeRes.json() : { presetType: null }
      const progression = progressionRes.ok ? await progressionRes.json() : { progressionState: null }
      const strategies = strategiesRes.ok ? await strategiesRes.json() : { data: [] }
      const positions = positionsRes.ok ? await positionsRes.json() : { positions: [] }
      const observability = observabilityRes.ok ? await observabilityRes.json() : { connection: null }

      const indicationsList = Array.isArray(indications)
        ? indications
        : Array.isArray(indications.indications)
          ? indications.indications
          : Array.isArray(indications.data)
            ? indications.data
            : Object.entries(indications)
                .filter(([, enabled]) => typeof enabled === "boolean")
                .map(([type, enabled]) => ({
                  indication_type: type,
                  indication_name: `${type[0].toUpperCase()}${type.slice(1)} indication`,
                  is_enabled: enabled,
                }))

      setInfo({
        indications: indicationsList,
        settings: settings,
        presetType: presetType.presetType,
        progression: progression.progressionState || null,
        strategies: strategies.data || [],
        positions: positions.positions || positions.data || [],
        observability: observability.connection || null,
      })
    } catch (error) {
      console.error("[v0] Failed to load connection info:", error)
      toast.error("Error loading information", {
        description: error instanceof Error ? error.message : "Failed to load information",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connection Information - {connectionName}</DialogTitle>
          <DialogDescription>View configured indications, preset type, and settings</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preset Type Section */}
            {info?.presetType && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Preset Type</h3>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{info.presetType.name}</Badge>
                    {info.presetType.is_predefined && <Badge variant="outline">Predefined</Badge>}
                  </div>
                  {info.presetType.description && (
                    <p className="text-sm text-muted-foreground">{info.presetType.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="font-medium">Base Strategy:</span> {info.presetType.base_strategy || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Direction:</span> {info.presetType.direction || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {info?.progression && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Live Connection State</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded">
                    <div className="font-medium mb-1">Cycles</div>
                    <div className="text-2xl font-bold">{info.progression.cyclesCompleted || 0}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium mb-1">Trades</div>
                    <div className="text-2xl font-bold">{info.progression.totalTrades || 0}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium mb-1">Tracked Indications</div>
                    <div className="text-2xl font-bold">{Math.max(info.progression.indicationsCount || 0, info.observability?.counts?.indications || 0)}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium mb-1">Tracked Strategies</div>
                    <div className="text-2xl font-bold">{Math.max(info.progression.strategiesCount || 0, info.observability?.counts?.strategies || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {info?.observability && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Engine Tracking Relation</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">Engine Status</div>
                      <div className="text-2xl font-bold capitalize">{info.observability.status || info.observability.engine?.status || "stopped"}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">Tracked Logs</div>
                      <div className="text-2xl font-bold">{info.observability.logSummary?.total || 0}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">Indications</div>
                      <div className="text-2xl font-bold">{info.observability.counts?.indications || 0}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">Strategies</div>
                      <div className="text-2xl font-bold">{info.observability.counts?.strategies || 0}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                    <div className="rounded border p-3">
                      <div className="font-medium mb-1">Prehistoric</div>
                      <div>{info.observability.prehistoric?.loaded ? "Loaded" : "Pending"}</div>
                      <div className="text-muted-foreground">Symbols: {info.observability.prehistoric?.symbols || 0}</div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="font-medium mb-1">Indication Types</div>
                      <div>D {info.observability.indications?.direction || 0} / M {info.observability.indications?.move || 0}</div>
                      <div className="text-muted-foreground">A {info.observability.indications?.active || 0} / O {info.observability.indications?.optimal || 0}</div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="font-medium mb-1">Strategy Stages</div>
                      <div>B {info.observability.strategies?.base || 0} / M {info.observability.strategies?.main || 0}</div>
                      <div className="text-muted-foreground">R {info.observability.strategies?.real || 0} / L {info.observability.strategies?.live || 0}</div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="font-medium mb-1">Cycle Health</div>
                      <div>{(info.observability.progression?.cycleSuccessRate || 0).toFixed(1)}% success</div>
                      <div className="text-muted-foreground">Trades: {info.observability.progression?.totalTrades || 0}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                    <div className="rounded border p-3">
                      <div className="font-medium mb-2">Historic Processing</div>
                      <div>Status: {info.observability.phases?.historic?.isLoaded ? "Loaded" : info.observability.phases?.historic?.isProcessing ? "Processing" : "Pending"}</div>
                      <div className="text-muted-foreground">Symbols: {info.observability.phases?.historic?.symbolsProcessed || 0}/{info.observability.phases?.historic?.symbolsTotal || 0}</div>
                      <div className="text-muted-foreground">Logs: {info.observability.phases?.historic?.logs || 0}</div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="font-medium mb-2">Realtime Processing</div>
                      <div>Status: {info.observability.phases?.realtime?.isActive ? info.observability.phases?.realtime?.isStale ? "Stale" : "Active" : "Idle"}</div>
                      <div className="text-muted-foreground">Symbols: {info.observability.phases?.realtime?.activeSymbols || 0}</div>
                      <div className="text-muted-foreground">Logs: {info.observability.phases?.realtime?.logs || 0}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Active Indications */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Active Indications ({info?.indications?.length || 0})</h3>
              {!info?.indications || info.indications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active indications</p>
              ) : (
                <div className="space-y-2">
                  {info.indications.map((ind: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={ind.is_enabled ? "default" : "secondary"}>{ind.indication_type}</Badge>
                        <span className="font-medium">{ind.indication_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
                        <div>Range: {ind.range || "N/A"}</div>
                        <div>Timeout: {ind.timeout || "N/A"}ms</div>
                        <div>Interval: {ind.interval || "N/A"}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Adjust Settings */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Configuration Settings</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Base Volume Factor</div>
                  <div className="text-2xl font-bold">{toNumber(info?.settings?.settings?.baseVolumeFactor ?? info?.settings?.baseVolumeFactor, 1).toFixed(2)}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Range Percentage</div>
                  <div className="text-2xl font-bold">{toNumber(info?.settings?.settings?.volumeRangePercentage ?? info?.settings?.volumeRangePercentage, 20)}%</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Target Positions</div>
                  <div className="text-2xl font-bold">{toNumber(info?.settings?.settings?.targetPositions ?? info?.settings?.targetPositions, 50)}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Live Trade Factor</div>
                  <div className="text-2xl font-bold">{toNumber(info?.settings?.settings?.baseVolumeFactorLive ?? info?.settings?.baseVolumeFactorLive, 1).toFixed(2)}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Open Positions</div>
                  <div className="text-2xl font-bold">{info?.positions?.length || 0}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-medium mb-1">Strategies in Scope</div>
                  <div className="text-2xl font-bold">{info?.strategies?.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
