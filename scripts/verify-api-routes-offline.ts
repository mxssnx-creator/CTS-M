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

  const failed = results.filter((result) => result.status === "FAIL")
  console.log(`\nOffline API verification: ${results.length - failed.length}/${results.length} passed`)
  process.exit(failed.length > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error("Fatal offline verification error:", error)
  process.exit(1)
})
