/**
 * Exchange Connector Test Script
 * Tests exchange API integration and trading functionality
 * 
 * NOTE: This requires valid API credentials to be set in environment variables:
 * - BYBIT_API_KEY, BYBIT_API_SECRET
 * - BINANCE_API_KEY, BINANCE_API_SECRET
 * - OKX_API_KEY, OKX_API_SECRET, OKX_API_PASSPHRASE
 */

import { createExchangeConnector } from "../lib/exchange-connectors"

interface TestResult {
  exchange: string
  test: string
  passed: boolean
  message: string
  duration?: number
}

const results: TestResult[] = []

async function testExchangeConnection(exchange: string, apiKey?: string, apiSecret?: string, apiPassphrase?: string) {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`Testing ${exchange.toUpperCase()} Exchange`)
  console.log("=".repeat(60))
  
  if (!apiKey || !apiSecret) {
    console.log(`⚠ Skipping ${exchange} - No API credentials provided`)
    results.push({
      exchange,
      test: "Connection",
      passed: false,
      message: "No API credentials provided",
    })
    return
  }
  
  try {
    const startTime = Date.now()
    
    // Create connector
    console.log("Creating connector...")
    const connector = await createExchangeConnector(exchange, {
      apiKey,
      apiSecret,
      apiPassphrase,
      isTestnet: true, // Use testnet by default
    })
    
    // Test connection
    console.log("Testing connection...")
    const connectionResult = await connector.testConnection()
    const duration = Date.now() - startTime
    
    if (connectionResult.success) {
      console.log("✓ Connection successful!")
      console.log(`  Balance: ${connectionResult.balance} USDT`)
      console.log(`  Duration: ${duration}ms`)
      results.push({
        exchange,
        test: "Connection",
        passed: true,
        message: `Balance: ${connectionResult.balance} USDT`,
        duration,
      })
    } else {
      console.log("✗ Connection failed:", connectionResult.error)
      results.push({
        exchange,
        test: "Connection",
        passed: false,
        message: connectionResult.error || "Unknown error",
        duration,
      })
      return
    }
    
    // Test market data fetch
    console.log("\nTesting market data fetch...")
    try {
      const ticker = await connector.getTicker("BTC/USDT")
      if (ticker && ticker.last) {
        console.log("✓ Market data fetch successful!")
        console.log(`  BTC/USDT Price: ${ticker.last}`)
        results.push({
          exchange,
          test: "Market Data",
          passed: true,
          message: `BTC/USDT: ${ticker.last}`,
        })
      }
    } catch (error) {
      console.log("✗ Market data fetch failed:", error instanceof Error ? error.message : "Unknown error")
      results.push({
        exchange,
        test: "Market Data",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
    
    // Test balance fetch
    console.log("\nTesting balance fetch...")
    try {
      const balance = await connector.getBalance()
      if (balance && typeof balance.balance !== "undefined") {
        console.log("✓ Balance fetch successful!")
        console.log(`  Balance: ${balance.balance} USDT`)
        results.push({
          exchange,
          test: "Balance",
          passed: true,
          message: `Balance: ${balance.balance} USDT`,
        })
      }
    } catch (error) {
      console.log("✗ Balance fetch failed:", error instanceof Error ? error.message : "Unknown error")
      results.push({
        exchange,
        test: "Balance",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
    
  } catch (error) {
    console.log("✗ Exchange test failed:", error instanceof Error ? error.message : "Unknown error")
    results.push({
      exchange,
      test: "Setup",
      passed: false,
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function runExchangeTests() {
  console.log("=".repeat(60))
  console.log("EXCHANGE CONNECTOR TEST SUITE")
  console.log("=".repeat(60))
  console.log("\nNote: Set API credentials in environment variables to test live connections")
  console.log("Example: BYBIT_API_KEY=xxx BYBIT_API_SECRET=yyy bun scripts/test-exchange-connectors.ts\n")
  
  // Test Bybit
  await testExchangeConnection(
    "bybit",
    process.env.BYBIT_API_KEY,
    process.env.BYBIT_API_SECRET
  )
  
  // Test Binance
  await testExchangeConnection(
    "binance",
    process.env.BINANCE_API_KEY,
    process.env.BINANCE_API_SECRET
  )
  
  // Test OKX
  await testExchangeConnection(
    "okx",
    process.env.OKX_API_KEY,
    process.env.OKX_API_SECRET,
    process.env.OKX_API_PASSPHRASE
  )
  
  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("TEST SUMMARY")
  console.log("=".repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  
  console.log("\nDetailed Results:")
  results.forEach(r => {
    const icon = r.passed ? "✓" : "✗"
    console.log(`${icon} ${r.exchange.padEnd(10)} ${r.test.padEnd(15)} ${r.message}`)
  })
  
  console.log("\n" + "=".repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

runExchangeTests().catch((error) => {
  console.error("Exchange test suite crashed:", error)
  process.exit(1)
})
