#!/usr/bin/env node

/**
 * Comprehensive Engine Verification Test
 * Tests all phases: prehistoric → indications → strategies → realtime → live_trading
 */

const BASE_URL = "http://localhost:3000"

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testEndpoint(name: string, path: string) {
  try {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) {
      console.log(`❌ ${name}: HTTP ${res.status}`)
      return false
    }
    const data = await res.json()
    console.log(`✅ ${name}: OK`)
    return data
  } catch (err) {
    console.log(`❌ ${name}: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function runComprehensiveTest() {
  console.log("\n=== COMPREHENSIVE ENGINE VERIFICATION TEST ===\n")

  // Test 1: System Verification
  console.log("📋 TEST 1: System Verification Endpoint")
  const systemStatus = await testEndpoint("System Verify", "/api/system/verify-engine")
  if (!systemStatus) return
  
  if (!systemStatus.coordinatorRunning) {
    console.log("⚠️  WARNING: Global coordinator not running")
  }

  if (systemStatus.components.length === 0) {
    console.log("❌ FAIL: No active components found")
    return
  }

  const comp = systemStatus.components[0]
  console.log(`\n   Active Connection: ${comp.connectionName}`)
  console.log(`   Exchange: ${comp.exchange}`)
  console.log(`   Testnet: ${comp.isTestnet ? "YES ❌" : "NO ✅"}`)

  // Test 2: Phase Verification
  console.log("\n📋 TEST 2: Phase Completion Verification")
  
  const phases = [
    { name: "Prehistoric Data", check: comp.phases.prehistoric.completed, metric: comp.phases.prehistoric.progressionCycles },
    { name: "Indications", check: comp.phases.indications.cycleCount > 0, metric: comp.phases.indications.cycleCount },
    { name: "Strategies", check: comp.phases.strategies.cycleCount > 0, metric: comp.phases.strategies.cycleCount },
    { name: "Realtime", check: comp.phases.realtime.cycleCount > 0, metric: comp.phases.realtime.cycleCount },
    { name: "Live Trading", check: comp.phases.liveTrading.active, metric: comp.phases.liveTrading.tradesTotal },
  ]

  let allPhasesPassing = true
  for (const phase of phases) {
    if (phase.check) {
      console.log(`✅ ${phase.name}: ${phase.metric} recorded`)
    } else {
      console.log(`❌ ${phase.name}: FAILED`)
      allPhasesPassing = false
    }
  }

  // Test 3: Performance Metrics
  console.log("\n📋 TEST 3: Performance Metrics")
  console.log(`   Indication Avg Duration: ${comp.phases.indications.avgDurationMs}ms`)
  console.log(`   Strategy Avg Duration: ${comp.phases.strategies.avgDurationMs}ms`)
  console.log(`   Success Rate: ${comp.metrics.successRate}`)
  console.log(`   Total Cycles: ${comp.metrics.totalCycles}`)
  console.log(`   Failed Cycles: ${comp.metrics.failedCycles}`)

  // Test 4: Progression API
  console.log("\n📋 TEST 4: Progression API")
  const progression = await testEndpoint("Progression Status", `/api/connections/progression/${comp.connectionId}`)
  if (progression) {
    console.log(`   Phase: ${progression.phase}`)
    console.log(`   Progress: ${progression.progress}%`)
    console.log(`   Running: ${progression.running ? "YES ✅" : "NO ❌"}`)
  }

  // Test 5: Data Volume Verification
  console.log("\n📋 TEST 5: Data Processing Volume")
  console.log(`   Recent Indications: ${comp.phases.indications.recentRecords}`)
  console.log(`   Recent Strategies: ${comp.phases.strategies.recentRecords}`)
  console.log(`   Total Trades: ${comp.phases.liveTrading.tradesTotal}`)
  console.log(`   Active Positions: ${comp.phases.liveTrading.pseudoPositions}`)

  // Test 6: Last Run Times
  console.log("\n📋 TEST 6: Processor Activity (Last Run)")
  console.log(`   Indication Last Run: ${comp.phases.indications.lastRun ? new Date(comp.phases.indications.lastRun).toLocaleTimeString() : "Never"}`)
  console.log(`   Strategy Last Run: ${comp.phases.strategies.lastRun ? new Date(comp.phases.strategies.lastRun).toLocaleTimeString() : "Never"}`)
  console.log(`   Realtime Last Run: ${comp.phases.realtime.lastRun ? new Date(comp.phases.realtime.lastRun).toLocaleTimeString() : "Never"}`)

  // Final Summary
  console.log("\n=== VERIFICATION SUMMARY ===\n")
  if (allPhasesPassing && comp.engineRunning) {
    console.log("✅ ALL PHASES PASSING")
    console.log("✅ ENGINE RUNNING")
    console.log("✅ DATA PROCESSING ACTIVE")
    console.log("\n🚀 COMPREHENSIVE ENGINE TEST: PASSED")
    console.log("\nThe trading engine is fully operational:")
    console.log("  • Prehistoric data loaded and processed")
    console.log("  • Indications calculating continuously")
    console.log("  • Strategies evaluating trades")
    console.log("  • Realtime monitoring active")
    console.log("  • Live trading operational")
    process.exit(0)
  } else {
    console.log("❌ ISSUES DETECTED")
    if (!allPhasesPassing) {
      console.log("  • Some phases not passing")
    }
    if (!comp.engineRunning) {
      console.log("  • Engine not running")
    }
    console.log("\n⚠️  COMPREHENSIVE ENGINE TEST: FAILED")
    process.exit(1)
  }
}

// Run the test
runComprehensiveTest().catch((err) => {
  console.error("Test crashed:", err)
  process.exit(1)
})
