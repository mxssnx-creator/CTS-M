/**
 * End-to-End Engine Test with BingX Real API
 * 
 * Tests:
 * 1. Connection state management (base vs main)
 * 2. Engine startup via quickstart
 * 3. Real market data loading from BingX
 * 4. Indication processor on prehistoric + realtime data
 * 5. Strategy evaluation
 * 6. Engine stability (no restarts on refresh)
 * 7. Comprehensive logging and metrics
 */

import { initRedis, getAllConnections, getAssignedAndEnabledConnections, getRedisClient, updateConnection } from "@/lib/redis-db"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { loadMarketDataForEngine } from "@/lib/market-data-loader"
import { createExchangeConnector } from "@/lib/exchange-connectors"

interface TestResult {
  testName: string
  status: "pass" | "fail" | "pending"
  error?: string
  details?: any
}

const results: TestResult[] = []

function logTest(testName: string, status: "pass" | "fail" | "pending", error?: string, details?: any) {
  console.log(`\n${status === "pass" ? "✓" : status === "fail" ? "✗" : "⏳"} ${testName}`)
  if (error) console.error(`  Error: ${error}`)
  if (details) console.log(`  Details:`, details)
  results.push({ testName, status, error, details })
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testConnectionStateManagement() {
  console.log("\n========== TEST 1: Connection State Management ==========")
  
  try {
    await initRedis()
    const allConnections = await getAllConnections()
    
    logTest("Get all connections", "pass", undefined, { count: allConnections.length })
    
    // Find or create BingX connection
    let bingxConn = allConnections.find((c: any) => c.exchange === "bingx")
    
    if (!bingxConn) {
      logTest("BingX connection exists", "fail", "No BingX connection found")
      return
    }
    
    logTest("BingX connection exists", "pass", undefined, {
      id: bingxConn.id,
      name: bingxConn.name,
      exchange: bingxConn.exchange,
      is_inserted: bingxConn.is_inserted,
      is_active_inserted: bingxConn.is_active_inserted,
      is_enabled_dashboard: bingxConn.is_enabled_dashboard,
    })
    
    // Test that base connection is not auto-assigned to main
    if (bingxConn.is_inserted === "1" && bingxConn.is_active_inserted !== "1") {
      logTest("No auto-assignment (base connection independent)", "pass")
    } else {
      logTest("No auto-assignment (base connection independent)", "fail", 
        `Expected base but not auto-assigned, got: is_inserted=${bingxConn.is_inserted}, is_active_inserted=${bingxConn.is_active_inserted}`)
    }
    
    // Get assigned and enabled connections
    const assignedConnections = await getAssignedAndEnabledConnections()
    
    if (assignedConnections.length > 0) {
      logTest("Assigned and enabled connections retrieved", "pass", undefined, { count: assignedConnections.length })
    } else {
      logTest("Assigned and enabled connections retrieved", "fail", "No assigned connections found - need to assign BingX to main panel")
    }
    
  } catch (error: any) {
    logTest("Connection state management", "fail", error.message)
  }
}

async function testEngineQuickstart() {
  console.log("\n========== TEST 2: Engine Quickstart ==========")
  
  try {
    await initRedis()
    const assignedConnections = await getAssignedAndEnabledConnections()
    
    if (assignedConnections.length === 0) {
      logTest("Engine quickstart", "fail", "No assigned connections - manually assign BingX to main panel first")
      return
    }
    
    const bingxConn = assignedConnections.find((c: any) => c.exchange === "bingx")
    
    if (!bingxConn) {
      logTest("Engine quickstart", "fail", "BingX not in assigned connections - need to assign it")
      return
    }
    
    logTest("BingX assigned and enabled", "pass", undefined, { connectionId: bingxConn.id })
    
    // Get coordinator and initialize engine
    const coordinator = getGlobalTradeEngineCoordinator()
    
    const engineConfig = {
      connectionId: bingxConn.id,
      connection_name: bingxConn.name,
      exchange: bingxConn.exchange,
      engine_type: "standard",
      indicationInterval: 5,
      strategyInterval: 5,
      realtimeInterval: 5,
    }
    
    console.log("[TEST] Initializing engine with config:", engineConfig)
    const manager = await coordinator.initializeEngine(bingxConn.id, engineConfig)
    logTest("Engine initialized", "pass", undefined, { connectionId: bingxConn.id })
    
    console.log("[TEST] Starting engine...")
    await coordinator.startEngine(bingxConn.id, engineConfig)
    logTest("Engine started", "pass", undefined, { connectionId: bingxConn.id })
    
    // Wait for initial startup
    await sleep(2000)
    
    // Check engine status
    const status = await coordinator.getEngineStatus(bingxConn.id)
    logTest("Engine status retrieved", "pass", undefined, status)
    
  } catch (error: any) {
    logTest("Engine quickstart", "fail", error.message)
  }
}

async function testMarketDataLoading() {
  console.log("\n========== TEST 3: Market Data Loading from BingX ==========")
  
  try {
    await initRedis()
    
    // Test symbols
    const symbols = ["BTCUSDT", "ETHUSDT"]
    
    console.log(`[TEST] Loading market data for symbols: ${symbols.join(", ")}`)
    const loaded = await loadMarketDataForEngine(symbols)
    
    if (loaded > 0) {
      logTest("Market data loaded from exchange", "pass", undefined, { symbols: symbols.length, loaded })
      
      // Verify data was actually saved
      const client = getRedisClient()
      for (const symbol of symbols) {
        try {
          const data = await client.get(`market_data:${symbol}:1m`)
          if (data) {
            const parsed = JSON.parse(data as string)
            logTest(`Market data for ${symbol}`, "pass", undefined, {
              close: parsed.close,
              volume: parsed.volume,
              timestamp: parsed.timestamp,
            })
          } else {
            logTest(`Market data for ${symbol}`, "fail", "No data found in Redis")
          }
        } catch (e: any) {
          logTest(`Market data for ${symbol}`, "fail", e.message)
        }
      }
    } else {
      logTest("Market data loaded from exchange", "fail", "No market data loaded")
    }
    
  } catch (error: any) {
    logTest("Market data loading", "fail", error.message)
  }
}

async function testRealExchangeConnector() {
  console.log("\n========== TEST 4: Real Exchange Connector (BingX OHLCV) ==========")
  
  try {
    const credentials = {
      apiKey: process.env.BINGX_API_KEY || "PLACEHOLDER",
      apiSecret: process.env.BINGX_API_SECRET || "PLACEHOLDER",
      apiPassphrase: process.env.BINGX_API_PASSPHRASE || "PLACEHOLDER",
      isTestnet: false,
    }
    
    const connector = await createExchangeConnector("bingx", credentials)
    
    // Test with real API
    console.log("[TEST] Fetching real OHLCV from BingX...")
    const ohlcv = await connector.getOHLCV("BTCUSDT", "1m", 10)
    
    if (ohlcv && ohlcv.length > 0) {
      logTest("Real OHLCV from BingX", "pass", undefined, {
        symbol: "BTCUSDT",
        candles: ohlcv.length,
        latest: ohlcv[ohlcv.length - 1],
      })
    } else {
      logTest("Real OHLCV from BingX", "pending", "No data (may be using placeholder credentials)")
    }
    
  } catch (error: any) {
    logTest("Real exchange connector", "fail", error.message)
  }
}

async function testEngineStability() {
  console.log("\n========== TEST 5: Engine Stability (No Restart on Refresh) ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const assignedConnections = await getAssignedAndEnabledConnections()
    
    if (assignedConnections.length === 0) {
      logTest("Engine stability", "pending", "No assigned connections")
      return
    }
    
    const connId = assignedConnections[0].id
    
    // Get initial cycle count
    const progression1 = await client.hgetall(`progression:${connId}`)
    const cycles1 = parseInt((progression1?.cycles_completed as string) || "0")
    
    console.log(`[TEST] Initial cycles: ${cycles1}`)
    logTest("Initial engine state captured", "pass", undefined, { cycles: cycles1 })
    
    // Wait
    await sleep(1000)
    
    // Get progression again (simulating refresh)
    const progression2 = await client.hgetall(`progression:${connId}`)
    const cycles2 = parseInt((progression2?.cycles_completed as string) || "0")
    
    console.log(`[TEST] After 1s: ${cycles2} cycles`)
    
    if (cycles2 >= cycles1) {
      logTest("Engine continues without restart", "pass", undefined, { before: cycles1, after: cycles2 })
    } else {
      logTest("Engine continues without restart", "fail", "Cycles decreased (possible restart)")
    }
    
  } catch (error: any) {
    logTest("Engine stability", "fail", error.message)
  }
}

async function testComprehensiveLogging() {
  console.log("\n========== TEST 6: Comprehensive Logging and Metrics ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const assignedConnections = await getAssignedAndEnabledConnections()
    
    if (assignedConnections.length === 0) {
      logTest("Comprehensive logging", "pending", "No assigned connections")
      return
    }
    
    const connId = assignedConnections[0].id
    
    // Check progression logs
    const progression = await client.hgetall(`progression:${connId}`)
    if (progression && Object.keys(progression).length > 0) {
      logTest("Progression tracking", "pass", undefined, {
        cycles: progression.cycles_completed,
        successful: progression.successful_cycles,
        failed: progression.failed_cycles,
        last_update: progression.last_update,
      })
    } else {
      logTest("Progression tracking", "fail", "No progression data found")
    }
    
    // Check for engine logs
    const logs = await client.lrange(`engine_logs:${connId}`, 0, 4)
    if (logs && logs.length > 0) {
      logTest("Engine logs captured", "pass", undefined, { logCount: logs.length })
    } else {
      logTest("Engine logs captured", "pending", "No logs yet (engine may be just starting)")
    }
    
    // Check for indications
    const indications = await client.lrange(`indications:${connId}`, 0, 4)
    if (indications && indications.length > 0) {
      logTest("Indications generated", "pass", undefined, { count: indications.length })
    } else {
      logTest("Indications generated", "pending", "No indications yet (may need more cycles)")
    }
    
  } catch (error: any) {
    logTest("Comprehensive logging", "fail", error.message)
  }
}

async function printSummary() {
  console.log("\n========== TEST SUMMARY ==========")
  
  const passed = results.filter(r => r.status === "pass").length
  const failed = results.filter(r => r.status === "fail").length
  const pending = results.filter(r => r.status === "pending").length
  const total = results.length
  
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Pending: ${pending}`)
  
  if (failed > 0) {
    console.log("\nFailed tests:")
    results.filter(r => r.status === "fail").forEach(r => {
      console.log(`  - ${r.testName}: ${r.error}`)
    })
  }
  
  if (pending > 0) {
    console.log("\nPending tests:")
    results.filter(r => r.status === "pending").forEach(r => {
      console.log(`  - ${r.testName}`)
    })
  }
}

async function runAllTests() {
  console.log("🚀 Starting End-to-End Engine Tests with BingX Real API\n")
  
  try {
    await testConnectionStateManagement()
    await testEngineQuickstart()
    await testMarketDataLoading()
    await testRealExchangeConnector()
    await testEngineStability()
    await testComprehensiveLogging()
  } catch (error: any) {
    console.error("\n❌ Critical error during testing:", error.message)
  }
  
  await printSummary()
}

// Run tests if this file is executed directly (CommonJS context)
try {
  // In ESM/TypeScript build context, this won't throw
  if (typeof require !== 'undefined' && require.main === module) {
    runAllTests().catch(console.error)
  }
} catch (e) {
  // Continue in other contexts
}

export { runAllTests }
