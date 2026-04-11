export type NormalizedProgressionStatus = {
  phase: string
  label: string
  tone: "default" | "secondary" | "destructive" | "warning" | "success"
  isActive: boolean
  isInterrupted: boolean
  isRecovering: boolean
}

const LABELS: Record<string, string> = {
  idle: "Idle",
  disabled: "Disabled",
  stopped: "Stopped",
  initializing: "Initializing",
  prehistoric_data: "Historical Loading",
  indications: "Indications",
  strategies: "Strategies",
  realtime: "Realtime",
  live_trading: "Live Trading",
  interrupted: "Interrupted",
  recovering: "Recovering",
  error: "Error",
}

export function normalizeProgressionStatus(phase: string | null | undefined): NormalizedProgressionStatus {
  const normalized = String(phase || "idle")
  if (normalized === "interrupted") {
    return { phase: normalized, label: LABELS[normalized], tone: "destructive", isActive: false, isInterrupted: true, isRecovering: false }
  }
  if (normalized === "recovering") {
    return { phase: normalized, label: LABELS[normalized], tone: "warning", isActive: true, isInterrupted: false, isRecovering: true }
  }
  if (["live_trading", "realtime", "strategies", "indications", "initializing", "prehistoric_data"].includes(normalized)) {
    return { phase: normalized, label: LABELS[normalized] || normalized, tone: "success", isActive: true, isInterrupted: false, isRecovering: false }
  }
  if (normalized === "error") {
    return { phase: normalized, label: LABELS[normalized], tone: "destructive", isActive: false, isInterrupted: false, isRecovering: false }
  }
  return { phase: normalized, label: LABELS[normalized] || normalized, tone: "secondary", isActive: false, isInterrupted: false, isRecovering: false }
}
