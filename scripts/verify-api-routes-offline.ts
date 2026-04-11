#!/usr/bin/env bun

type OfflineRouteTestResult = {
  name: string
  status: "PASS" | "FAIL"
  message: string
}

async function run() {
  const results: OfflineRouteTestResult[] = []

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn()
      results.push({ name, status: "PASS", message: "OK" })
      console.log(`PASS ${name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({ name, status: "FAIL", message })
      console.log(`FAIL ${name} - ${message}`)
    }
  }

  await test("system health route", async () => {
    const { GET } = await import("@/app/api/system/health/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload?.status) {
      throw new Error("missing status payload")
    }
  })

  await test("trade engine status route", async () => {
    const { GET } = await import("@/app/api/trade-engine/status/route")
    const request = new Request("http://offline.test/api/trade-engine/status")
    const response = await (GET as any)(request)
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!Array.isArray(payload?.connections)) {
      throw new Error("missing connections array")
    }
    if (payload.connections.some((connection: any) => connection.status === "running" && connection.recovery?.stale)) {
      throw new Error("running connection reported stale recovery state")
    }
  })

  await test("progression route", async () => {
    const { GET } = await import("@/app/api/connections/progression/[id]/route")
    const request = new Request("http://offline.test/api/connections/progression/demo-mode")
    const response = await GET(request as any, { params: Promise.resolve({ id: "demo-mode" }) })
    if (![200, 500].includes(response.status)) {
      throw new Error(`unexpected status ${response.status}`)
    }
    const payload = await response.json()
    if (!(payload?.progression || payload?.success === false)) {
      throw new Error("missing progression payload")
    }
  })

  await test("main indications stats route", async () => {
    const { GET } = await import("@/app/api/main/indications-stats/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || typeof payload.success !== "boolean" || !payload.indications) {
      throw new Error("missing indications payload")
    }
  })

  await test("main strategies evaluation route", async () => {
    const { GET } = await import("@/app/api/main/strategies-evaluation/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || typeof payload.success !== "boolean" || !payload.strategies) {
      throw new Error("missing strategies payload")
    }
  })

  await test("trade engine detailed logs route", async () => {
    const { GET } = await import("@/app/api/trade-engine/detailed-logs/route")
    const request = new Request("http://offline.test/api/trade-engine/detailed-logs")
    const response = await GET(request)
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || typeof payload.success !== "boolean" || !Array.isArray(payload.logs)) {
      throw new Error("missing detailed logs payload")
    }
  })

  await test("engine progress route", async () => {
    const { GET } = await import("@/app/api/engine-progress/route")
    const response = await GET(new Request("http://offline.test/api/engine-progress?connectionId=demo-mode") as any)
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload?.progress) {
      throw new Error("missing progress payload")
    }
  })

  await test("trade engine progression route", async () => {
    const { GET } = await import("@/app/api/trade-engine/progression/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || !Array.isArray(payload.connections)) {
      throw new Error("missing trade engine progression payload")
    }
  })

  await test("strategies overview route", async () => {
    const { GET } = await import("@/app/api/strategies/overview/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || typeof payload.success !== "boolean" || !Array.isArray(payload.strategies)) {
      throw new Error("missing strategies overview payload")
    }
  })

  await test("system monitoring route", async () => {
    const { GET } = await import("@/app/api/system/monitoring/route")
    const response = await GET()
    if (response.status !== 200) {
      throw new Error(`expected 200, got ${response.status}`)
    }
    const payload = await response.json()
    if (!payload?.services || !payload?.engines) {
      throw new Error("missing monitoring payload")
    }
  })

  await test("monitoring stats route", async () => {
    const { GET } = await import("@/app/api/monitoring/stats/route")
    const request = new Request("http://offline.test/api/monitoring/stats")
    const response = await GET({ nextUrl: new URL(request.url) } as any)
    if (![200, 500].includes(response.status)) {
      throw new Error(`unexpected status ${response.status}`)
    }
    const payload = await response.json()
    if (typeof payload?.totalConnections !== "number") {
      throw new Error("missing monitoring stats payload")
    }
  })

  const failed = results.filter((result) => result.status === "FAIL")
  console.log(`\nOffline API verification: ${results.length - failed.length}/${results.length} passed`)
  process.exit(failed.length > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error("Fatal offline verification error:", error)
  process.exit(1)
})
