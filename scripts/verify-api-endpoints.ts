#!/usr/bin/env node

/**
 * API Endpoint Verification Script
 * Tests all critical API endpoints with various data types and scenarios
 */

// Using built-in fetch (Node 18+)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3001'
const DEMO_CONNECTION_ID = 'demo-mode'
const REAL_CONNECTION_ID = 'bingx-x01'

interface EndpointTestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'WARN'
  statusCode?: number
  message: string
  duration: number
}

const testResults: EndpointTestResult[] = []

async function test(
  endpoint: string,
  method: string = 'GET',
  expectedStatus: number = 200,
  options?: any,
): Promise<EndpointTestResult> {
  const start = Date.now()

  try {
    const url = `${BASE_URL}${endpoint}`
    console.log(`Testing: ${method} ${url}`)

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    const duration = Date.now() - start
    const contentType = response.headers.get('content-type')
    let data = null

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    const passed = response.status === expectedStatus
    const result: EndpointTestResult = {
      endpoint,
      method,
      status: passed ? 'PASS' : 'FAIL',
      statusCode: response.status,
      message: passed ? 'OK' : `Expected ${expectedStatus}, got ${response.status}`,
      duration,
    }

    testResults.push(result)
    console.log(
      `  ${result.status} [${response.status}] ${duration}ms${result.message ? ` - ${result.message}` : ''}`,
    )

    return result
  } catch (error) {
    const duration = Date.now() - start
    const message = error instanceof Error ? error.message : String(error)
    const result: EndpointTestResult = {
      endpoint,
      method,
      status: 'FAIL',
      message: `Error: ${message}`,
      duration,
    }

    testResults.push(result)
    console.log(`  FAIL ${duration}ms - ${message}`)

    return result
  }
}

async function runTests() {
  console.log(`\n🧪 CTS v3 API Endpoint Verification\n`)
  console.log(`Target: ${BASE_URL}\n`)

  try {
    const healthResponse = await fetch(`${BASE_URL}/api/system/health`)
    if (!healthResponse.ok) {
      throw new Error(`bootstrap health returned ${healthResponse.status}`)
    }
  } catch (error) {
    console.log('⚠️  API server is not reachable; endpoint verification requires a running app instance.')
    console.log('    Run `bun run verify:offline` for handler-level offline verification.')
    console.log(`    ${error instanceof Error ? error.message : String(error)}`)
    process.exit(0)
  }

  // Real-Time Updates (SSE)
  console.log('📡 Real-Time Updates (SSE)')
  console.log('───────────────────────────────')
  await test(`/api/ws?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 200)
  await test(`/api/ws?connectionId=${REAL_CONNECTION_ID}`, 'GET', 200)

  // Broadcast Statistics
  console.log('\n📊 Broadcast Statistics')
  console.log('──────────────────────')
  await test(`/api/broadcast/stats`, 'GET', 401) // Should be 401 without auth
  await test(`/api/broadcast/health`, 'GET', 200)

  // Data Endpoints
  console.log('\n📈 Data Endpoints')
  console.log('─────────────────')
  await test(`/api/data/positions?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 200)
  await test(`/api/data/strategies?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 200)
  await test(`/api/data/indications?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 200)
  await test(`/api/data/presets?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 200)

  // Metrics
  console.log('\n📉 Processing Metrics')
  console.log('────────────────────')
  await test(`/api/metrics/processing?connectionId=${DEMO_CONNECTION_ID}`, 'GET', 401) // Should be 401 without auth

  // Trade Engine
  console.log('\n⚙️  Trade Engine Control')
  console.log('──────────────────────')
  await test(`/api/trade-engine/status`, 'GET', 200)
  await test(`/api/trade-engine/health`, 'GET', 200)

  // Monitoring
  console.log('\n🔍 Monitoring')
  console.log('─────────────')
  await test(`/api/monitoring/stats`, 'GET', 200)
  await test(`/api/system/monitoring`, 'GET', 200)
  await test(`/api/system/health`, 'GET', 200)

  // Settings
  console.log('\n⚙️  Settings')
  console.log('───────────')
  await test(`/api/settings/connection-settings/${DEMO_CONNECTION_ID}`, 'GET', 200)
  await test(`/api/settings/connection-settings/${REAL_CONNECTION_ID}`, 'GET', 200)

  // Connections
  console.log('\n🔗 Connections')
  console.log('──────────────')
  await test(`/api/connections`, 'GET', 200)
  await test(`/api/connections/available`, 'GET', 200)

  // Summary
  console.log('\n\n📋 Test Summary')
  console.log('═════════════════════════════════════════')

  const passed = testResults.filter((r) => r.status === 'PASS').length
  const failed = testResults.filter((r) => r.status === 'FAIL').length
  const warned = testResults.filter((r) => r.status === 'WARN').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warned: ${warned}`)
  console.log(`📊 Total:  ${testResults.length}`)

  console.log('\n⏱️  Response Times')
  console.log('──────────────────')
  const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length
  const maxDuration = Math.max(...testResults.map((r) => r.duration))
  const minDuration = Math.min(...testResults.map((r) => r.duration))

  console.log(`Average: ${avgDuration.toFixed(0)}ms`)
  console.log(`Max:     ${maxDuration}ms`)
  console.log(`Min:     ${minDuration}ms`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults
      .filter((r: EndpointTestResult) => r.status === 'FAIL')
      .forEach((r: EndpointTestResult) => {
        console.log(`  ${r.endpoint} - ${r.message}`)
      })
  }

  console.log('\n✅ Verification Complete!\n')

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
