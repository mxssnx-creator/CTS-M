export interface MainpageValidationResult {
  valid: boolean
  issues: string[]
}

function isFiniteNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value)
}

export function validateMainpageOverview(data: any): MainpageValidationResult {
  const issues: string[] = []

  if (!data || data.success !== true) {
    issues.push("system overview response is not successful")
  }

  const overview = data?.overview
  if (!overview) {
    issues.push("missing overview payload")
  }

  if (!Array.isArray(overview?.strategies)) {
    issues.push("missing strategies overview list")
  }

  if (!Array.isArray(overview?.indications)) {
    issues.push("missing indications overview list")
  }

  if (!overview?.performance || !isFiniteNumber(overview.performance?.last250Positions?.total)) {
    issues.push("missing performance metrics")
  }

  if (overview?.processing && typeof overview.processing !== "object") {
    issues.push("invalid processing overview")
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
