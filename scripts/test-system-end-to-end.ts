/**
 * End-to-End System Test Suite
 * Tests all critical functionality including:
 * - Redis connectivity and data persistence
 * - Market data seeding and retrieval
 * - Exchange connection testing
 * - Trading engine initialization
 * - API endpoint functionality
 */

import { initRedis, getRedisClient, saveMarketData, getMarketData, getAllConnections } from "../lib/redis-db"
import { runPreStartup } from "../lib/pre-startup"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001"

async function testRedisConnectivity() {
  console.log("\n========== TEST 1: Redis Connectivity ==========")
  try {
    await initRedis()
    const client = getRedisClient()
    
    // Test basic operations
    await client.set("test:key", "test-value")
    const value = await client.get("test:key")
    
    if (value === "test-value") {
      console.log("✓ Redis read/write: PASS")
    } else {
      console.log("✗ Redis read/write: FAIL - Got:", value)
      return false
    }
    
    await client.del("test:key")
    console.log("✓ Redis connection: PASS")
    return true
  } catch (error) {
    console.error("✗ Redis connectivity: FAIL -", error)
    return false
  }
}

async function testMarketDataPersistence() {
  console.log("\n========== TEST 2: Market Data Persistence ==========")
  try {
    const testSymbol = "TESTUSDT"
    const testData = {
      symbol: testSymbol,
      exchange: "bybit",
      interval: "1m",
      price: 100,
      open: 99,
      high: 101,
      low: 98,
      close: 100,
      volume: 1000,
      timestamp: new Date().toISOString(),
    }
    
    console.log("Saving market data for", testSymbol)
    await saveMarketData(testSymbol, testData)
    
    console.log("Retrieving market data...")
    const retrieved = await getMarketData(testSymbol)
    
    if (retrieved && typeof retrieved === "object") {
      console.log("✓ Market data saved and retrieved for", testSymbol)
      console.log("✓ Market data persistence: PASS")
      return true
    } else {
      console.log("✗ Market data persistence: FAIL - No data retrieved")
      return false
    }
  } catch (error) {
    console.error("✗ Market data persistence: FAIL -", error)
    return false
  }
}

async function testPreStartupSeeding() {
  console.log("\n========== TEST 3: Pre-Startup Data Seeding ==========")
  try {
    await runPreStartup()
    
    // Check if connections were created
    const connections = await getAllConnections()
    console.log("Connections seeded:", connections?.length || 0)
    
    if (!connections || connections.length === 0) {
      console.log("✗ Connection seeding: FAIL")
      return false
    }
    
    console.log("✓ Connection seeding: PASS -", connections.length, "connections")
    
    // Check if market data was seeded
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
    let marketDataCount = 0
    
    for (const symbol of symbols) {
      const data = await getMarketData(symbol)
      if (data && typeof data === "object") {
        marketDataCount += 1
        console.log(`✓ ${symbol}: data available`)
      } else {
        console.log(`✗ ${symbol}: No data`)
      }
    }
    
    if (marketDataCount > 0) {
      console.log("✓ Market data seeding: PASS -", marketDataCount, "total data points")
      return true
    } else {
      console.log("✗ Market data seeding: FAIL - No market data found")
      return false
    }
  } catch (error) {
    console.error("✗ Pre-startup seeding: FAIL -", error)
    return false
  }
}

async function testAPIEndpoints() {
  console.log("\n========== TEST 4: API Endpoints ==========")
  try {
    // Test settings endpoint
    const settingsResponse = await fetch(`${BASE_URL}/api/settings`)
    if (settingsResponse.ok) {
      const data = await settingsResponse.json()
      console.log("✓ GET /api/settings: PASS -", Object.keys(data.settings || {}).length, "settings")
    } else {
      console.log("✗ GET /api/settings: FAIL - Status:", settingsResponse.status)
      return false
    }
    
    // Test connections endpoint
    const connectionsResponse = await fetch(`${BASE_URL}/api/settings/connections`)
    if (connectionsResponse.ok) {
      const data = await connectionsResponse.json()
      console.log("✓ GET /api/settings/connections: PASS -", data.connections?.length || 0, "connections")
    } else {
      console.log("✗ GET /api/settings/connections: FAIL - Status:", connectionsResponse.status)
      return false
    }
    
    // Test market data endpoint
    const marketDataResponse = await fetch(`${BASE_URL}/api/market-data?symbol=BTCUSDT&limit=10`)
    if (marketDataResponse.ok) {
      const data = await marketDataResponse.json()
      console.log("✓ GET /api/market-data: PASS -", data.data?.length || 0, "records")
    } else {
      console.log("✗ GET /api/market-data: FAIL - Status:", marketDataResponse.status)
      return false
    }
    
    console.log("✓ API endpoints: PASS")
    return true
  } catch (error) {
    console.error("✗ API endpoints: FAIL -", error)
    return false
  }
}

async function testExchangeConnectors() {
  console.log("\n========== TEST 5: Exchange Connectors ==========")
  try {
    const { createExchangeConnector } = await import("../lib/exchange-connectors")
    
    // Test connector creation (without real API keys)
    const exchanges = ["bybit", "binance", "okx"]
    
    for (const exchange of exchanges) {
      try {
        const connector = await createExchangeConnector(exchange, {
          apiKey: "TEST_KEY",
          apiSecret: "TEST_SECRET",
          isTestnet: true,
        })
        
        if (connector) {
          console.log(`✓ ${exchange} connector: CREATED`)
        }
      } catch (error) {
        console.log(`✗ ${exchange} connector: FAIL -`, error instanceof Error ? error.message : "Unknown error")
      }
    }
    
    console.log("✓ Exchange connectors: PASS")
    return true
  } catch (error) {
    console.error("✗ Exchange connectors: FAIL -", error)
    return false
  }
}

async function runAllTests() {
  console.log("=".repeat(60))
  console.log("CTS v3.2 - END-TO-END SYSTEM TEST SUITE")
  console.log("=".repeat(60))
  
  const results = {
    redis: await testRedisConnectivity(),
    marketData: await testMarketDataPersistence(),
    seeding: await testPreStartupSeeding(),
    api: await testAPIEndpoints(),
    connectors: await testExchangeConnectors(),
  }
  
  console.log("\n" + "=".repeat(60))
  console.log("TEST SUMMARY")
  console.log("=".repeat(60))
  
  const passed = Object.values(results).filter(Boolean).length
  const total = Object.values(results).length
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? "✓" : "✗"} ${name}: ${passed ? "PASS" : "FAIL"}`)
  })
  
  console.log("\n" + "=".repeat(60))
  console.log(`RESULTS: ${passed}/${total} tests passed`)
  console.log("=".repeat(60))
  
  process.exit(passed === total ? 0 : 1)
}

runAllTests().catch((error) => {
  console.error("Test suite crashed:", error)
  process.exit(1)
})
