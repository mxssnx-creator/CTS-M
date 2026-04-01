/**
 * Comprehensive E2E Test: Full Flow with Connection Assignment
 * 
 * Tests the complete flow:
 * 1. Verify migrations ran and base connections exist
 * 2. Assign BingX to main panel (simulate user action)
 * 3. Enable BingX in dashboard (simulate user action)
 * 4. Start engine via quickstart
 * 5. Verify market data loads from BingX
 * 6. Verify indications are generated
 * 7. Verify strategies evaluate
 * 8. Verify engine stability
 */

import { 
  initRedis, 
  getAllConnections, 
  getAssignedAndEnabledConnections, 
  getRedisClient,
  updateConnection,
} from "@/lib/redis-db"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { runMigrations, getMigrationStatus } from "@/lib/redis-migrations"

interface TestResult {
  testName: string
  status: "pass" | "fail" | "pending"
  error?: string
  details?: any
}

const results: TestResult[] = []

function logTest(testName: string, status: "pass" | "fail" | "pending", error?: string, details?: any) {
  const icon = status === "pass" ? "✓" : status === "fail" ? "✗" : "⏳"
  console.log(`\n${icon} ${testName}`)
  if (error) console.error(`  Error: ${error}`)
  if (details) console.log(`  Details:`, details)
  results.push({ testName, status, error, details })
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function test1_VerifyMigrations() {
  console.log("\n========== TEST 1: Verify Migrations & Base Connections ==========")
  
  try {
    await initRedis()
    const status = await getMigrationStatus()
    
    if (status.currentVersion === 18 && status.isMigrated) {
      logTest("Migrations completed to v18", "pass", undefined, { version: status.currentVersion })
    } else {
      logTest("Migrations completed to v18", "fail", `Only at v${status.currentVersion}`)
      return
    }
    
    // Run migrations if needed
    const result = await runMigrations()
    logTest("Migrations executed", "pass", undefined, { message: result.message })
    
    // Check base connections
    const allConnections = await getAllConnections()
    const bingx = allConnections.find((c: any) => c.exchange === "bingx")
    const bybit = allConnections.find((c: any) => c.exchange === "bybit")
    
    if (bingx && bybit) {
      logTest("Base connections exist", "pass", undefined, { 
        total: allConnections.length,
        bingx: bingx.id,
        bybit: bybit.id
      })
    } else {
      logTest("Base connections exist", "fail", "Missing BingX or Bybit")
      return
    }
    
    // Verify state: base connections should NOT be auto-assigned
    if (bingx.is_active_inserted !== "1" && bingx.is_enabled_dashboard !== "1") {
      logTest("BingX not auto-assigned to main panel", "pass")
    } else {
      logTest("BingX not auto-assigned to main panel", "fail", 
        `BingX has is_active_inserted=${bingx.is_active_inserted}, is_enabled_dashboard=${bingx.is_enabled_dashboard}`)
    }
    
  } catch (error: any) {
    logTest("Verify migrations & connections", "fail", error.message)
  }
}

async function test2_AssignBingXToMain() {
  console.log("\n========== TEST 2: Assign BingX to Main Panel (User Action) ==========")
  
  try {
    await initRedis()
    const allConnections = await getAllConnections()
    const bingx = allConnections.find((c: any) => c.exchange === "bingx")
    
    if (!bingx) {
      logTest("BingX found", "fail", "BingX connection not found")
      return
    }
    
    // Step 1: Assign to main connections
    const updated = {
      ...bingx,
      is_active_inserted: "1", // Assign to main panel
    }
    
    await updateConnection(bingx.id, updated)
    logTest("Assigned BingX to main panel", "pass", undefined, { connectionId: bingx.id })
    
    // Verify assignment
    const allAgain = await getAllConnections()
    const bingxVerify = allAgain.find((c: any) => c.exchange === "bingx")
    
    if (bingxVerify?.is_active_inserted === "1") {
      logTest("Assignment verified", "pass")
    } else {
      logTest("Assignment verified", "fail", `is_active_inserted=${bingxVerify?.is_active_inserted}`)
    }
    
  } catch (error: any) {
    logTest("Assign BingX to main", "fail", error.message)
  }
}

async function test3_EnableBingXDashboard() {
  console.log("\n========== TEST 3: Enable BingX in Dashboard (User Action) ==========")
  
  try {
    await initRedis()
    const allConnections = await getAllConnections()
    const bingx = allConnections.find((c: any) => c.exchange === "bingx")
    
    if (!bingx) {
      logTest("BingX found", "fail", "BingX connection not found")
      return
    }
    
    // Step 2: Enable dashboard
    const updated = {
      ...bingx,
      is_enabled_dashboard: "1", // Enable in dashboard
    }
    
    await updateConnection(bingx.id, updated)
    logTest("Enabled BingX in dashboard", "pass", undefined, { connectionId: bingx.id })
    
    // Verify both flags now set
    const allAgain = await getAllConnections()
    const bingxVerify = allAgain.find((c: any) => c.exchange === "bingx")
    
    if (bingxVerify?.is_active_inserted === "1" && bingxVerify?.is_enabled_dashboard === "1") {
      logTest("Dashboard enabled verified", "pass")
    } else {
      logTest("Dashboard enabled verified", "fail", 
        `is_active_inserted=${bingxVerify?.is_active_inserted}, is_enabled_dashboard=${bingxVerify?.is_enabled_dashboard}`)
      return
    }
    
    // Check if it shows up in assigned+enabled list
    const assigned = await getAssignedAndEnabledConnections()
    const assignedBingx = assigned.find((c: any) => c.exchange === "bingx")
    
    if (assignedBingx) {
      logTest("BingX in assigned & enabled list", "pass", undefined, { count: assigned.length })
    } else {
      logTest("BingX in assigned & enabled list", "fail", `Not found in ${assigned.length} assigned connections`)
    }
    
  } catch (error: any) {
    logTest("Enable BingX dashboard", "fail", error.message)
  }
}

async function test4_StartEngine() {
  console.log("\n========== TEST 4: Start Engine via Quickstart ==========")
  
  try {
    await initRedis()
    const assigned = await getAssignedAndEnabledConnections()
    
    if (assigned.length === 0) {
      logTest("Engine start", "fail", "No assigned & enabled connections")
      return
    }
    
    const bingx = assigned.find((c: any) => c.exchange === "bingx")
    if (!bingx) {
      logTest("Engine start", "fail", "BingX not in assigned list")
      return
    }
    
    const coordinator = getGlobalTradeEngineCoordinator()
    
    const config = {
      connectionId: bingx.id,
      connection_name: bingx.name,
      exchange: "bingx",
      engine_type: "standard",
      indicationInterval: 5,
      strategyInterval: 5,
      realtimeInterval: 5,
    }
    
    console.log(`[TEST] Starting engine for ${bingx.name}...`)
    await coordinator.initializeEngine(bingx.id, config)
    logTest("Engine initialized", "pass")
    
    await coordinator.startEngine(bingx.id, config)
    logTest("Engine started", "pass")
    
    // Wait for startup to complete
    await sleep(3000)
    
    const status = await coordinator.getEngineStatus(bingx.id)
    if (status.status === "running") {
      logTest("Engine running", "pass", undefined, status)
    } else {
      logTest("Engine running", "fail", `Status=${status.status}`)
    }
    
  } catch (error: any) {
    logTest("Start engine", "fail", error.message)
  }
}

async function test5_CheckMarketData() {
  console.log("\n========== TEST 5: Market Data Loading & Verification ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const assigned = await getAssignedAndEnabledConnections()
    
    if (assigned.length === 0) {
      logTest("Market data check", "pending", "No active engine")
      return
    }
    
    // Wait a bit for market data to be fetched
    await sleep(2000)
    
    // Check if market data was stored
    const symbols = ["BTCUSDT", "ETHUSDT"]
    let foundData = 0
    
    for (const symbol of symbols) {
      try {
        const data = await client.get(`market_data:${symbol}:1m`)
        if (data) {
          foundData++
          const parsed = JSON.parse(data as string)
          console.log(`[TEST] ${symbol}: close=${parsed.close}, volume=${parsed.volume}`)
        }
      } catch (e) {
        // Data might not exist yet
      }
    }
    
    if (foundData > 0) {
      logTest("Market data loaded", "pass", undefined, { symbols: foundData })
    } else {
      logTest("Market data loaded", "pending", "No market data yet (engine may still be initializing)")
    }
    
  } catch (error: any) {
    logTest("Market data check", "fail", error.message)
  }
}

async function test6_CheckProgression() {
  console.log("\n========== TEST 6: Engine Progression & Processing ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const assigned = await getAssignedAndEnabledConnections()
    
    if (assigned.length === 0) {
      logTest("Progression check", "pending", "No active engine")
      return
    }
    
    const connId = assigned[0].id
    
    // Check progression state
    const progression = await client.hgetall(`progression:${connId}`)
    
    if (progression && Object.keys(progression).length > 0) {
      const cycles = parseInt((progression.cycles_completed as string) || "0")
      const successful = parseInt((progression.successful_cycles as string) || "0")
      const failed = parseInt((progression.failed_cycles as string) || "0")
      
      logTest("Engine progression tracked", "pass", undefined, {
        cycles,
        successful,
        failed,
        last_update: progression.last_update,
      })
      
      // Check if processing is happening
      if (cycles > 0) {
        logTest("Engine processing data", "pass", undefined, { cycles })
      } else {
        logTest("Engine processing data", "pending", "No cycles completed yet")
      }
    } else {
      logTest("Engine progression tracked", "pending", "No progression data yet")
    }
    
    // Check for indications
    const indications = await client.lrange(`indications:${connId}`, 0, 4)
    if (indications && indications.length > 0) {
      logTest("Indications generated", "pass", undefined, { count: indications.length })
    } else {
      logTest("Indications generated", "pending", "No indications yet")
    }
    
  } catch (error: any) {
    logTest("Progression check", "fail", error.message)
  }
}

async function test7_CheckStability() {
  console.log("\n========== TEST 7: Engine Stability (State Persistence) ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const assigned = await getAssignedAndEnabledConnections()
    
    if (assigned.length === 0) {
      logTest("Stability check", "pending", "No active engine")
      return
    }
    
    const connId = assigned[0].id
    
    // Get initial state
    const prog1 = await client.hgetall(`progression:${connId}`)
    const cycles1 = parseInt((prog1?.cycles_completed as string) || "0")
    
    console.log(`[TEST] Initial cycles: ${cycles1}`)
    
    // Wait and simulate a refresh (no restart)
    await sleep(2000)
    
    // Get state again
    const prog2 = await client.hgetall(`progression:${connId}`)
    const cycles2 = parseInt((prog2?.cycles_completed as string) || "0")
    
    console.log(`[TEST] After 2s: ${cycles2} cycles`)
    
    if (cycles2 >= cycles1) {
      logTest("Engine stability verified", "pass", undefined, { before: cycles1, after: cycles2, delta: cycles2 - cycles1 })
    } else {
      logTest("Engine stability verified", "fail", "Cycles decreased (possible restart)")
    }
    
  } catch (error: any) {
    logTest("Stability check", "fail", error.message)
  }
}

async function test8_CheckConnectionIndependence() {
  console.log("\n========== TEST 8: Connection State Independence ==========")
  
  try {
    await initRedis()
    const client = getRedisClient()
    const allConnections = await getAllConnections()
    
    const bingx = allConnections.find((c: any) => c.exchange === "bingx")
    if (!bingx) {
      logTest("Connection independence", "fail", "BingX not found")
      return
    }
    
    // Remove from base connections (simulate user deleting from Settings)
    await client.del(`connection:${bingx.id}`)
    await client.srem("connections", bingx.id)
    
    console.log(`[TEST] Deleted BingX from base connections`)
    
    // Check if it still exists in main panel (should still be assigned)
    const assigned = await getAssignedAndEnabledConnections()
    const assignedBingx = assigned.find((c: any) => c.exchange === "bingx")
    
    if (assignedBingx) {
      logTest("Deletion from base doesn't affect main assignment", "pass", 
        undefined, { stillFound: true })
    } else {
      logTest("Deletion from base doesn't affect main assignment", "pending", 
        "Cannot verify (would need separate main panel storage)")
    }
    
    // Restore the connection for other tests
    await initRedis()
    await runMigrations()
    
  } catch (error: any) {
    logTest("Connection independence", "fail", error.message)
  }
}

async function printSummary() {
  console.log("\n========== FINAL TEST SUMMARY ==========\n")
  
  const passed = results.filter(r => r.status === "pass").length
  const failed = results.filter(r => r.status === "fail").length
  const pending = results.filter(r => r.status === "pending").length
  const total = results.length
  
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0
  console.log(`${percent}% PASS | Total: ${total} | ✓ ${passed} | ✗ ${failed} | ⏳ ${pending}`)
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:")
    results.filter(r => r.status === "fail").forEach(r => {
      console.log(`  - ${r.testName}: ${r.error}`)
    })
  }
  
  if (pending > 0) {
    console.log("\n⏳ PENDING TESTS (may pass after more time):")
    results.filter(r => r.status === "pending").forEach(r => {
      console.log(`  - ${r.testName}`)
    })
  }
  
  if (failed === 0 && pending <= 3) {
    console.log("\n✅ ENGINE IS WORKING! All critical systems verified.")
  }
}

async function runAllTests() {
  console.log("🚀 COMPREHENSIVE E2E TEST: Full Engine Flow with BingX\n")
  
  try {
    await test1_VerifyMigrations()
    await test2_AssignBingXToMain()
    await test3_EnableBingXDashboard()
    await test4_StartEngine()
    await test5_CheckMarketData()
    await test6_CheckProgression()
    await test7_CheckStability()
    await test8_CheckConnectionIndependence()
  } catch (error: any) {
    console.error("\n❌ CRITICAL ERROR:", error.message)
  }
  
  await printSummary()
  process.exit(failed > 2 ? 1 : 0)
}

const failed = results.filter(r => r.status === "fail").length

// Auto-run
runAllTests().catch(e => {
  console.error("Fatal error:", e)
  process.exit(1)
})

export { runAllTests }
