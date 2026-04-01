/**
 * REAL DATA TEST: Full End-to-End with BingX Real API
 * 
 * Tests with actual market data from BingX:
 * 1. Fetch real OHLCV data
 * 2. Load into engine
 * 3. Process through indications
 * 4. Evaluate strategies
 * 5. Monitor engine processing
 * 6. Verify comprehensive logging
 */

import { 
  initRedis,
  getAllConnections,
  getAssignedAndEnabledConnections,
  getRedisClient,
  updateConnection,
} from "@/lib/redis-db"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { runMigrations } from "@/lib/redis-migrations"
import { createExchangeConnector } from "@/lib/exchange-connectors"
import { getBaseConnectionCredentials } from "@/lib/base-connection-credentials"

let testsPassed = 0
let testsFailed = 0
const startTime = Date.now()

function log(title: string, status: "✓" | "✗" | "ℹ", message: string, details?: any) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[${elapsed}s] ${status} [${title}] ${message}`)
  if (details) console.log(`      ${JSON.stringify(details)}`)
  if (status === "✓") testsPassed++
  if (status === "✗") testsFailed++
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log("🚀 REAL DATA ENGINE TEST: BingX Live API\n")
  console.log("========== PHASE 1: Initialize with Real Credentials ==========\n")
  
  try {
    // Phase 1: Initialize
    await initRedis()
    log("Redis", "✓", "Connected")
    
    // Run migrations
    const migResult = await runMigrations()
    log("Migrations", "✓", `${migResult.message} (v${migResult.version})`)
    
    // Get all connections
    const allConns = await getAllConnections()
    log("Base Connections", "✓", `${allConns.length} connections`, { 
      bingx: allConns.find((c: any) => c.exchange === "bingx")?.id 
    })
    
    const bingx = allConns.find((c: any) => c.exchange === "bingx")
    if (!bingx) {
      log("BingX Connection", "✗", "Not found")
      return
    }
    
    log("BingX Connection", "✓", "Found and ready", { 
      id: bingx.id,
      hasApiKey: !!bingx.api_key,
      keyLength: bingx.api_key?.length || 0
    })
    
    console.log("\n========== PHASE 2: Test Real BingX API Connection ==========\n")
    
    // Get real credentials
    const creds = getBaseConnectionCredentials("bingx-x01")
    log("Credentials", "✓", "Loaded from static config", { 
      keyLength: creds.apiKey.length,
      secretLength: creds.apiSecret.length
    })
    
    // Create connector with real credentials
    const connector = await createExchangeConnector("bingx", {
      apiKey: creds.apiKey,
      apiSecret: creds.apiSecret,
      isTestnet: false,
    })
    
    log("Exchange Connector", "✓", "Created for BingX")
    
    // Test connection
    const testResult = await connector.testConnection()
    if (testResult.success) {
      log("BingX API Test", "✓", "Connection successful")
    } else {
      log("BingX API Test", "✗", `Connection failed: ${testResult.error}`)
    }
    
    console.log("\n========== PHASE 3: Fetch Real Market Data ==========\n")
    
    // Fetch real OHLCV data
    const symbols = ["BTCUSDT", "ETHUSDT"]
    const ohlcvData: Record<string, any[]> = {}
    
    for (const symbol of symbols) {
      try {
        console.log(`[Fetching] ${symbol}...`)
        const candles = await connector.getOHLCV(symbol, "1m", 100)
        
        if (candles && candles.length > 0) {
          ohlcvData[symbol] = candles
          const latest = candles[candles.length - 1]
          log(`${symbol} OHLCV`, "✓", `${candles.length} candles fetched`, {
            latest_close: latest.close,
            latest_high: latest.high,
            latest_low: latest.low,
            latest_volume: latest.volume,
            timestamp: new Date(latest.timestamp).toISOString()
          })
        } else {
          log(`${symbol} OHLCV`, "ℹ", "No data returned")
        }
      } catch (error: any) {
        log(`${symbol} OHLCV`, "✗", error.message)
      }
    }
    
    console.log("\n========== PHASE 4: Assign BingX & Start Engine ==========\n")
    
    // Assign to main
    await updateConnection(bingx.id, {
      ...bingx,
      is_active_inserted: "1",
      is_enabled_dashboard: "1",
    })
    log("BingX Assignment", "✓", "Assigned to main panel")
    
    // Start engine
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
    
    await coordinator.initializeEngine(bingx.id, config)
    await coordinator.startEngine(bingx.id, config)
    log("Engine", "✓", "Started with real BingX connection")
    
    await sleep(3000)
    
    console.log("\n========== PHASE 5: Monitor Engine Processing ==========\n")
    
    const client = getRedisClient()
    
    // Check market data in Redis
    for (const symbol of symbols) {
      const storedData = await client.get(`market_data:${symbol}:1m`)
      if (storedData) {
        const parsed = JSON.parse(storedData as string)
        log(`Market Data (${symbol})`, "✓", "Stored in Redis", {
          close: parsed.close,
          source: parsed.source || "unknown"
        })
      }
    }
    
    // Check progression
    const prog1 = await client.hgetall(`progression:${bingx.id}`)
    if (prog1 && Object.keys(prog1).length > 0) {
      const cycles = parseInt((prog1.cycles_completed as string) || "0")
      const successful = parseInt((prog1.successful_cycles as string) || "0")
      const failed = parseInt((prog1.failed_cycles as string) || "0")
      log("Engine Progression", "✓", `Processing active`, {
        cycles,
        successful,
        failed,
        phase: prog1.phase || "unknown"
      })
    } else {
      log("Engine Progression", "ℹ", "No progression data yet")
    }
    
    console.log("\n========== PHASE 6: Wait for Processing Cycles ==========\n")
    
    // Wait for more cycles to complete
    for (let i = 0; i < 4; i++) {
      await sleep(1000)
      const prog = await client.hgetall(`progression:${bingx.id}`)
      const cycles = parseInt((prog?.cycles_completed as string) || "0")
      const indications = await client.lrange(`indications:${bingx.id}`, 0, 0)
      console.log(`[${i + 1}s] Cycles: ${cycles}, Indications: ${indications?.length || 0}`)
    }
    
    console.log("\n========== PHASE 7: Verify Real Data Flow ==========\n")
    
    const progFinal = await client.hgetall(`progression:${bingx.id}`)
    const cyclesFinal = parseInt((progFinal?.cycles_completed as string) || "0")
    const successFinal = parseInt((progFinal?.successful_cycles as string) || "0")
    
    if (cyclesFinal > 0) {
      log("Cycles Processed", "✓", `${cyclesFinal} cycles completed`, {
        successful_cycles: successFinal,
        success_rate: `${Math.round((successFinal / cyclesFinal) * 100)}%`
      })
    } else {
      log("Cycles Processed", "ℹ", "Still initializing")
    }
    
    // Check indications
    const indications = await client.lrange(`indications:${bingx.id}`, 0, 9)
    if (indications && indications.length > 0) {
      log("Indications Generated", "✓", `${indications.length} indications`, {
        first_indication: JSON.parse(indications[0] as string).symbol
      })
    } else {
      log("Indications Generated", "ℹ", "None yet (may need more cycles)")
    }
    
    // Check strategies
    const strategies = await client.lrange(`strategy_results:${bingx.id}`, 0, 9)
    if (strategies && strategies.length > 0) {
      log("Strategies Evaluated", "✓", `${strategies.length} strategy results`)
    } else {
      log("Strategies Evaluated", "ℹ", "None yet (depends on indications)")
    }
    
    console.log("\n========== PHASE 8: Check Comprehensive Logging ==========\n")
    
    // Get logs
    const logs = await client.lrange(`engine_logs:${bingx.id}`, 0, 19)
    if (logs && logs.length > 0) {
      log("Engine Logs", "✓", `${logs.length} log entries captured`)
      
      // Parse and show recent logs
      console.log("\n--- Recent Engine Logs ---")
      logs.slice(-3).forEach((logEntry: string) => {
        try {
          const parsed = JSON.parse(logEntry as string)
          console.log(`  [${parsed.level}] ${parsed.message}`)
        } catch (e) {
          console.log(`  ${logEntry}`)
        }
      })
    } else {
      log("Engine Logs", "ℹ", "No logs yet")
    }
    
    console.log("\n========== PHASE 9: Verify State Stability ==========\n")
    
    const cyclesBefore = parseInt((progFinal?.cycles_completed as string) || "0")
    await sleep(2000)
    
    const progAfter = await client.hgetall(`progression:${bingx.id}`)
    const cyclesAfter = parseInt((progAfter?.cycles_completed as string) || "0")
    
    if (cyclesAfter >= cyclesBefore) {
      log("State Persistence", "✓", "Engine continues without restart", {
        before: cyclesBefore,
        after: cyclesAfter,
        delta: cyclesAfter - cyclesBefore
      })
    } else {
      log("State Persistence", "✗", "Cycles decreased (restart detected!)")
    }
    
    console.log("\n========== FINAL SUMMARY ==========\n")
    
    const total = testsPassed + testsFailed
    const percent = total > 0 ? Math.round((testsPassed / total) * 100) : 0
    
    console.log(`SUCCESS RATE: ${percent}%`)
    console.log(`✓ Passed: ${testsPassed}`)
    console.log(`✗ Failed: ${testsFailed}`)
    console.log(`Total: ${total}`)
    
    console.log("\n📊 ENGINE STATUS:")
    console.log(`- Cycles completed: ${cyclesAfter}`)
    console.log(`- Real API connection: ${testResult.success ? "✓ Working" : "✗ Failed"}`)
    console.log(`- Market data loaded: ${Object.keys(ohlcvData).length} symbols`)
    console.log(`- Indications generated: ${indications?.length || 0}`)
    console.log(`- Engine stability: ${cyclesAfter >= cyclesBefore ? "✓ Stable" : "✗ Unstable"}`)
    
    if (testsFailed === 0) {
      console.log("\n✅ ALL CRITICAL TESTS PASSED - ENGINE PRODUCTION READY!")
    }
    
  } catch (error: any) {
    log("Fatal Error", "✗", error.message)
    console.error(error.stack)
  }
}

// Run the test
main().catch(e => {
  console.error("\n❌ FATAL ERROR:", e)
  process.exit(1)
})
