"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  RefreshCw,
  Activity,
  Database,
  Cpu,
  AlertTriangle,
  TrendingUp,
  Clock,
  Layers,
  HardDrive,
  Zap,
  GitBranch,
  BarChart2,
  History,
  Server,
} from "lucide-react"

interface Props {
  connectionId?: string
}

interface LogEntry {
  timestamp: string
  level?: string
  status?: string
  engine?: string
  phase?: string
  action?: string
  message?: string
  [key: string]: unknown
}

interface StatsData {
  cyclesCompleted?: number
  intervalsProcessed?: number
  prehistoricDataSize?: number | string
  redisDbEntries?: number
  redisDbSizeMb?: number
  indicationEvaluatedDirection?: number
  indicationEvaluatedMove?: number
  indicationEvaluatedActive?: number
  indicationEvaluatedOptimal?: number
  setsBaseCount?: number
  setsMainCount?: number
  setsRealCount?: number
  setsTotalCount?: number
  successfulCycles?: number
  failedCycles?: number
  cycleSuccessRate?: number
  totalTrades?: number
  successfulTrades?: number
  tradeSuccessRate?: number
  prehistoricCyclesCompleted?: number
  prehistoricSymbolsProcessedCount?: number
  prehistoricCandlesProcessed?: number
  strategyEvaluatedBase?: number
  strategyEvaluatedMain?: number
  strategyEvaluatedReal?: number
  processingCompleteness?: {
    prehistoricLoaded?: boolean
    indicationsRunning?: boolean
    strategiesRunning?: boolean
    realtimeRunning?: boolean
    hasErrors?: boolean
  }
}

export function QuickstartDetailedDialog({ connectionId = "bingx-x01" }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [resolvedConnectionId, setResolvedConnectionId] = useState(connectionId)

  const load = async () => {
    setLoading(true)
    try {
      const candidates = [
        connectionId,
        connectionId.startsWith("conn-") ? connectionId.replace(/^conn-/, "") : `conn-${connectionId}`,
      ]
      let chosenId = connectionId
      let statsPayload: Record<string, unknown> = {}
      let logsPayload: Record<string, unknown> = {}

      for (const candidate of candidates) {
        const [statsRes, logsRes] = await Promise.all([
          fetch(`/api/connections/progression/${candidate}/logs`),
          fetch(`/api/trade-engine/structured-logs?connectionId=${candidate}&limit=200`),
        ])
        const s = await statsRes.json().catch(() => ({}))
        const l = await logsRes.json().catch(() => ({}))
        if (statsRes.ok || (Array.isArray(l?.logs) && (l.logs as unknown[]).length > 0)) {
          chosenId = candidate
          statsPayload = s
          logsPayload = l
          break
        }
      }

      setResolvedConnectionId(chosenId)
      setStats((statsPayload?.progressionState as StatsData) || null)
      setLogs(Array.isArray(logsPayload?.logs) ? (logsPayload.logs as LogEntry[]) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void load()
    const timer = setInterval(() => {
      void load()
    }, 10000)
    return () => clearInterval(timer)
  }, [open, connectionId])

  const grouped = useMemo(() => {
    const overall = logs.filter((l) =>
      ["system", "coordinator", "initializing", "engine_starting"].some((k) =>
        String(l.engine || l.phase || "").toLowerCase().includes(k)
      )
    )
    const data = logs.filter((l) =>
      ["prehistoric", "realtime", "market-data", "market"].some((k) =>
        String(l.phase || l.engine || "").toLowerCase().includes(k)
      )
    )
    const engine = logs.filter((l) =>
      ["indications", "strategies", "database", "interval"].some((k) =>
        String(l.engine || l.phase || "").toLowerCase().includes(k)
      )
    )
    const errors = logs.filter((l) =>
      String(l.status || l.level || "").toLowerCase().includes("error")
    )
    return { overall, data, engine, errors }
  }, [logs])

  const formatNumber = (n: number | string | undefined) => {
    if (n === undefined || n === null) return "0"
    return typeof n === "number" ? n.toLocaleString() : String(n)
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color = "blue",
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    subValue?: string
    color?: string
  }) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
      green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
      purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
      amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
      cyan: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300",
      red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
      slate: "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    }

    return (
      <div className={`rounded-lg border p-3 ${colorMap[color] || colorMap.slate}`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 opacity-70" />
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</span>
        </div>
        <div className="text-lg font-bold">{formatNumber(value)}</div>
        {subValue && <div className="text-[10px] opacity-60 mt-0.5">{subValue}</div>}
      </div>
    )
  }

  const StatusBadge = ({ active, label }: { active?: boolean; label: string }) => (
    <Badge variant={active ? "default" : "outline"} className={`text-[10px] px-2 py-0 ${!active ? "opacity-50" : ""}`}>
      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${active ? "bg-current" : "bg-muted-foreground/30"}`} />
      {label}
    </Badge>
  )

  const LogSection = ({
    title,
    icon: Icon,
    entries,
    color,
    defaultOpen = false,
  }: {
    title: string
    icon: React.ElementType
    entries: LogEntry[]
    color: string
    defaultOpen?: boolean
  }) => {
    const [expanded, setExpanded] = useState(defaultOpen)

    const colorMap: Record<string, string> = {
      blue: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
      green: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
      purple: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20",
      red: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
    }

    const iconColorMap: Record<string, string> = {
      blue: "text-blue-600 dark:text-blue-400",
      green: "text-green-600 dark:text-green-400",
      purple: "text-purple-600 dark:text-purple-400",
      red: "text-red-600 dark:text-red-400",
    }

    return (
      <div className={`rounded-lg border ${colorMap[color]} overflow-hidden`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColorMap[color]}`} />
            <span className="text-sm font-semibold capitalize">{title}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {entries.length}
            </Badge>
          </div>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <div className="border-t border-inherit">
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-1">
                {entries.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">No entries</div>
                ) : (
                  entries.slice(0, 100).map((log, idx) => (
                    <LogEntryItem key={`${title}-${idx}`} log={log} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    )
  }

  const LogEntryItem = ({ log }: { log: LogEntry }) => {
    const [expanded, setExpanded] = useState(false)
    const level = String(log.level || log.status || "info").toLowerCase()

    const levelColors: Record<string, string> = {
      error: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
      warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
      debug: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50",
    }

    return (
      <div className="rounded border bg-background/80 dark:bg-background/50 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 shrink-0 ${levelColors[level] || "bg-slate-100 dark:bg-slate-800"}`}
          >
            {level || "info"}
          </Badge>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
            {log.engine || log.phase || "system"}
          </span>
          <span className="flex-1 text-left truncate">{log.action || log.message || "event"}</span>
          <svg
            className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <div className="border-t bg-muted/30 px-2.5 py-2">
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all text-muted-foreground max-h-40 overflow-auto">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(log).filter(([k]) => !["timestamp", "level", "status", "engine", "phase", "action", "message"].includes(k))
                ),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) void load() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Detailed Overview" className="h-8 w-8">
          <BarChart3 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Quickstart Detailed Overview
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>Connection: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{resolvedConnectionId}</code></span>
                <span>•</span>
                <span>{logs.length} log entries</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="main" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3 border-b bg-muted/20">
            <TabsList className="h-9">
              <TabsTrigger value="main" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" />
                Main
              </TabsTrigger>
              <TabsTrigger value="log" className="gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" />
                Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="main" className="flex-1 overflow-y-auto p-6 space-y-5 m-0">
            {/* Processing Status */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                Processing Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge active={stats?.processingCompleteness?.prehistoricLoaded} label="Prehistoric" />
                <StatusBadge active={stats?.processingCompleteness?.indicationsRunning} label="Indications" />
                <StatusBadge active={stats?.processingCompleteness?.strategiesRunning} label="Strategies" />
                <StatusBadge active={stats?.processingCompleteness?.realtimeRunning} label="Realtime" />
                {stats?.processingCompleteness?.hasErrors && (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Errors Detected
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Core Metrics */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Core Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <StatCard icon={Cpu} label="Cycles" value={stats?.cyclesCompleted || 0} subValue={`${stats?.successfulCycles || 0} success / ${stats?.failedCycles || 0} failed`} color="blue" />
                <StatCard icon={TrendingUp} label="Success Rate" value={`${((stats?.cycleSuccessRate || 0)).toFixed(1)}%`} color="green" />
                <StatCard icon={Layers} label="Intervals" value={stats?.intervalsProcessed || 0} color="purple" />
                <StatCard icon={Zap} label="Trades" value={stats?.totalTrades || 0} subValue={`${((stats?.tradeSuccessRate || 0)).toFixed(1)}% success`} color="cyan" />
                <StatCard icon={Database} label="DB Entries" value={stats?.redisDbEntries || 0} subValue={`${(stats?.redisDbSizeMb || 0).toFixed(2)} MB`} color="amber" />
                <StatCard icon={HardDrive} label="Prehistoric Keys" value={stats?.prehistoricDataSize || 0} color="orange" />
              </div>
            </div>

            <Separator />

            {/* Indications Pipeline */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5" />
                Indications Pipeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <StatCard icon={BarChart2} label="Direction" value={stats?.indicationEvaluatedDirection || 0} color="blue" />
                <StatCard icon={BarChart2} label="Move" value={stats?.indicationEvaluatedMove || 0} color="green" />
                <StatCard icon={BarChart2} label="Active" value={stats?.indicationEvaluatedActive || 0} color="purple" />
                <StatCard icon={BarChart2} label="Optimal" value={stats?.indicationEvaluatedOptimal || 0} color="orange" />
              </div>
            </div>

            <Separator />

            {/* Strategy Sets */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <Server className="h-3.5 w-3.5" />
                Strategy Sets
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <StatCard icon={Layers} label="Base Sets" value={stats?.setsBaseCount || 0} subValue={`${stats?.strategyEvaluatedBase || 0} evaluated`} color="blue" />
                <StatCard icon={Layers} label="Main Sets" value={stats?.setsMainCount || 0} subValue={`${stats?.strategyEvaluatedMain || 0} evaluated`} color="green" />
                <StatCard icon={Layers} label="Real Sets" value={stats?.setsRealCount || 0} subValue={`${stats?.strategyEvaluatedReal || 0} evaluated`} color="purple" />
                <StatCard icon={Layers} label="Total Sets" value={stats?.setsTotalCount || 0} color="slate" />
              </div>
            </div>

            <Separator />

            {/* Prehistoric Data Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Prehistoric Data
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <StatCard icon={Database} label="Symbols" value={stats?.prehistoricSymbolsProcessedCount || 0} color="amber" />
                <StatCard icon={Layers} label="Cycles" value={stats?.prehistoricCyclesCompleted || 0} color="orange" />
                <StatCard icon={BarChart2} label="Candles" value={stats?.prehistoricCandlesProcessed || 0} color="cyan" />
                <StatCard icon={HardDrive} label="Data Size" value={stats?.prehistoricDataSize || 0} color="slate" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="flex-1 overflow-hidden p-6 m-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  Log Entries by Category
                </h3>
                <span className="text-[10px] text-muted-foreground">{logs.length} total entries</span>
              </div>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-2">
                  <LogSection title="Overall" icon={Activity} entries={grouped.overall} color="blue" />
                  <LogSection title="Data" icon={Database} entries={grouped.data} color="green" />
                  <LogSection title="Engine" icon={Cpu} entries={grouped.engine} color="purple" />
                  <LogSection title="Errors" icon={AlertTriangle} entries={grouped.errors} color="red" defaultOpen />
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
