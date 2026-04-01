/**
 * API Functionality Test Script
 * Tests all API endpoints for proper functionality
 */

async function testEndpoint(name: string, url: string, method: string = "GET", body?: any) {
  try {
    console.log(`\nTesting ${method} ${url}...`)
    
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✓ ${name}: PASS (${response.status})`)
      console.log(`  Response:`, JSON.stringify(data).substring(0, 200))
      return true
    } else {
      console.log(`✗ ${name}: FAIL (${response.status})`)
      console.log(`  Error:`, data.error || data.details || "Unknown error")
      return false
    }
  } catch (error) {
    console.log(`✗ ${name}: FAIL - ${error instanceof Error ? error.message : "Unknown error"}`)
    return false
  }
}

async function runAPITests() {
  console.log("=".repeat(60))
  console.log("API FUNCTIONALITY TEST SUITE")
  console.log("=".repeat(60))
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001"
  
  const tests = [
    // Settings API
    { name: "Get Settings", url: `${baseUrl}/api/settings`, method: "GET" },
    { name: "Save Settings", url: `${baseUrl}/api/settings`, method: "POST", body: { test_setting: true } },
    
    // Connections API
    { name: "List Connections", url: `${baseUrl}/api/settings/connections`, method: "GET" },
    { name: "List Enabled Connections", url: `${baseUrl}/api/settings/connections?enabled=true`, method: "GET" },
    
    // Market Data API
    { name: "Get Market Data", url: `${baseUrl}/api/market-data?symbol=BTCUSDT&limit=10`, method: "GET" },
    
    // Install/Database API
    { name: "Database Status", url: `${baseUrl}/api/install/database/status`, method: "GET" },
    
    // System Health
    { name: "System Health", url: `${baseUrl}/api/health`, method: "GET" },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.method, test.body)
    if (result) {
      passed++
    } else {
      failed++
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log("\n" + "=".repeat(60))
  console.log("API TEST SUMMARY")
  console.log("=".repeat(60))
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total:  ${passed + failed}`)
  console.log("=".repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

runAPITests().catch((error) => {
  console.error("API test suite crashed:", error)
  process.exit(1)
})
