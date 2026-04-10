#!/usr/bin/env node

/**
 * Comprehensive Dev Mode Test Script
 * Tests complete progress, quickstart, engine processings and counts for prehistoric data,
 * processings, results, ratios, indications with results, strategies with results,
 * database loads, server loads, and overall infos for processed data.
 *
 * Shows detailed results after prehistoric processed + 1min realtime progress.
 */

import { spawn, ChildProcess } from 'child_process'
import * as http from 'http'

interface TestResult {
  section: string
  status: 'PASS' | 'FAIL' | 'WARN'
  data?: any
  error?: string
  duration?: number
}

interface SystemMetrics {
  cpu: number
  memory: number
  memoryUsed: number
  memoryTotal: number
  database: {
    size: number
    keys: number
    sets: number
    positions1h: number
    entries1h: number
    requestsPerSecond: number
  }
  services: {
    tradeEngine: boolean
    indicationsEngine: boolean
    strategiesEngine: boolean
    websocket: boolean
  }
  modules: {
    redis: boolean
    persistence: boolean
    coordinator: boolean
    logger: boolean
  }
  engines: {
    indications: {
      running: boolean
      cycleCount: number
      resultsCount: number
    }
    strategies: {
      running: boolean
      cycleCount: number
      resultsCount: number
    }
  }
  timestamp: string
}

class ComprehensiveTestRunner {
  private devProcess: ChildProcess | null = null
  private results: TestResult[] = []
  private startTime: Date = new Date()
  private baseUrl = 'http://localhost:3001'

  constructor() {
    console.log('\n🚀 CTS v3.1 Comprehensive Dev Mode Test Suite\n')
    console.log('═════════════════════════════════════════════════════════\n')
  }

  /**
   * Make HTTP request to API endpoint
   */
  private async makeRequest(path: string, method: string = 'GET', body?: any, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const postData = body ? JSON.stringify(body) : null

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        timeout,
        headers: {
          'User-Agent': 'ComprehensiveTestRunner/1.0',
          'Accept': 'application/json',
          ...(postData && {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          })
        }
      }

      const req = http.request(options, (res: http.IncomingMessage) => {
        let data = ''
        res.on('data', (chunk: Buffer) => data += chunk.toString())
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (e) {
            resolve(data)
          }
        })
      })

      req.on('error', (error: Error) => reject(error))
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (postData) {
        req.write(postData)
      }

      req.end()
    })
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServer(maxWaitSeconds: number = 60): Promise<boolean> {
    console.log('⏳ Waiting for dev server to start...')

    for (let i = 0; i < maxWaitSeconds; i++) {
      try {
        await this.makeRequest('/api/system/health', 'GET', 1000)
        console.log('✅ Dev server is ready!')
        return true
      } catch (error) {
        if (i % 10 === 0) {
          console.log(`   Still waiting... (${i}/${maxWaitSeconds}s)`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('❌ Dev server failed to start within timeout')
    return false
  }

  /**
   * Start dev server
   */
  private async startDevServer(): Promise<boolean> {
    console.log('🔧 Checking if dev server is already running...')

    try {
      await this.makeRequest('/api/system/health', 'GET', undefined, 1000)
      console.log('✅ Dev server is already running, skipping start')
      return true
    } catch {
      console.log('ℹ️ No external dev server detected; relying on existing sandbox runtime only')
      return true
    }
  }

  /**
   * Stop dev server
   */
  private stopDevServer(): void {
    if (this.devProcess) {
      console.log('🛑 Stopping dev server...')
      this.devProcess.kill('SIGTERM')
      this.devProcess = null
    }
  }

  /**
   * Test system health
   */
  private async testSystemHealth(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('🔍 Testing system health...')
      const health = await this.makeRequest('/api/system/health')

      return {
        section: 'System Health',
        status: health.status === 'healthy' ? 'PASS' : 'WARN',
        data: health,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'System Health',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test complete system verification
   */
  private async testCompleteVerification(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('🔍 Testing complete system verification...')
      const result = await this.makeRequest('/api/system/verify-complete')

      return {
        section: 'Complete Verification',
        status: result.status === 'success' ? 'PASS' : result.status === 'partial' ? 'WARN' : 'FAIL',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Complete Verification',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test system monitoring
   */
  private async testSystemMonitoring(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('📊 Testing system monitoring...')
      const monitoring = await this.makeRequest('/api/system/monitoring') as SystemMetrics

      return {
        section: 'System Monitoring',
        status: 'PASS',
        data: monitoring,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'System Monitoring',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test prehistoric data verification
   */
  private async testPrehistoricData(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('📈 Testing prehistoric data verification...')

      // First, trigger prehistoric data loading for demo connection
      try {
        const loadResult = await this.makeRequest('/api/symbol-data/load', 'POST', {
          connection_id: 'demo-mode',
          symbols: ['BTCUSDT', 'ETHUSDT'],
          timeframes: ['1h', '4h'],
          days_back: 7,
          batch_size: 2
        })
        console.log('   Symbol data load initiated:', loadResult)
      } catch (e) {
        console.log('   Symbol data load not available or failed, continuing...')
      }

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Verify engine status (includes prehistoric data)
      const result = await this.makeRequest('/api/system/verify-engine')

      return {
        section: 'Prehistoric Data',
        status: result.status === 'success' ? 'PASS' : result.status === 'partial' ? 'WARN' : 'FAIL',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Prehistoric Data',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test indications data
   */
  private async testIndicationsData(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('📊 Testing indications data...')
      const result = await this.makeRequest('/api/data/indications?connectionId=demo-mode')

      return {
        section: 'Indications Data',
        status: result.success ? 'PASS' : 'FAIL',
        data: {
          count: result.count,
          isDemo: result.isDemo,
          sample: result.data?.slice(0, 3)
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Indications Data',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test strategies data
   */
  private async testStrategiesData(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('🎯 Testing strategies data...')
      const result = await this.makeRequest('/api/data/strategies?connectionId=demo-mode')

      return {
        section: 'Strategies Data',
        status: result.success ? 'PASS' : 'FAIL',
        data: {
          count: result.count,
          isDemo: result.isDemo,
          sample: result.data?.slice(0, 3)
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Strategies Data',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test processing metrics
   */
  private async testProcessingMetrics(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('⚙️ Testing processing metrics...')
      const result = await this.makeRequest('/api/metrics/processing?connectionId=demo-mode')

      return {
        section: 'Processing Metrics',
        status: result.success ? 'PASS' : 'WARN',
        data: result.data,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Processing Metrics',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test engine metrics
   */
  private async testEngineMetrics(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('🚀 Testing engine metrics...')
      const result = await this.makeRequest('/api/engine-metrics')

      return {
        section: 'Engine Metrics',
        status: 'PASS',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Engine Metrics',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test trade engine quick start
   */
  private async testTradeEngineQuickStart(): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log('⚡ Testing trade engine quick start...')
      const result = await this.makeRequest('/api/trade-engine/quick-start')

      return {
        section: 'Trade Engine Quick Start',
        status: result.success ? 'PASS' : 'WARN',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Trade Engine Quick Start',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Monitor system for specified duration
   */
  private async monitorSystem(durationSeconds: number): Promise<TestResult[]> {
    console.log(`⏱️ Monitoring system for ${durationSeconds} seconds...`)

    const monitoringResults: TestResult[] = []
    const startTime = Date.now()
    const endTime = startTime + (durationSeconds * 1000)

    while (Date.now() < endTime) {
      const monitoringStart = Date.now()
      try {
        const monitoring = await this.makeRequest('/api/system/monitoring') as SystemMetrics
        monitoringResults.push({
          section: 'Realtime Monitoring',
          status: 'PASS',
          data: monitoring,
          duration: Date.now() - monitoringStart
        })
      } catch (error) {
        monitoringResults.push({
          section: 'Realtime Monitoring',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - monitoringStart
        })
      }

      // Wait 5 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return monitoringResults
  }

  /**
   * Display detailed results
   */
  private displayResults(results: TestResult[]): void {
    console.log('\n\n📋 DETAILED TEST RESULTS\n')
    console.log('═════════════════════════════════════════════════════════\n')

    // Summary
    const passCount = results.filter(r => r.status === 'PASS').length
    const warnCount = results.filter(r => r.status === 'WARN').length
    const failCount = results.filter(r => r.status === 'FAIL').length
    const totalCount = results.length

    console.log(`Total Tests: ${totalCount}`)
    console.log(`✅ Passed: ${passCount}`)
    console.log(`⚠️ Warnings: ${warnCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`⏱️ Total Duration: ${(Date.now() - this.startTime.getTime()) / 1000}s\n`)

    // Detailed results
    results.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
      console.log(`${index + 1}. ${statusIcon} ${result.section}`)
      console.log(`   Duration: ${result.duration}ms`)

      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2).split('\n').map(line => `   ${line}`).join('\n')}`)
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }

      console.log('')
    })

    // Performance analysis
    const monitoringResults = results.filter(r => r.section === 'Realtime Monitoring' && r.status === 'PASS')
    if (monitoringResults.length > 0) {
      console.log('\n📈 PERFORMANCE ANALYSIS\n')
      console.log('───────────────────────\n')

      const metrics = monitoringResults.map(r => r.data as SystemMetrics)

      // CPU and Memory trends
      const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length
      const avgMemory = metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length
      const maxCpu = Math.max(...metrics.map(m => m.cpu))
      const maxMemory = Math.max(...metrics.map(m => m.memory))

      console.log(`Average CPU Usage: ${avgCpu.toFixed(1)}%`)
      console.log(`Peak CPU Usage: ${maxCpu}%`)
      console.log(`Average Memory Usage: ${avgMemory.toFixed(1)}%`)
      console.log(`Peak Memory Usage: ${maxMemory}%`)

      // Database metrics
      const avgKeys = metrics.reduce((sum, m) => sum + m.database.keys, 0) / metrics.length
      const avgRequests = metrics.reduce((sum, m) => sum + m.database.requestsPerSecond, 0) / metrics.length

      console.log(`Average Database Keys: ${Math.round(avgKeys)}`)
      console.log(`Average Redis Requests/sec: ${avgRequests.toFixed(1)}`)

      // Engine status
      const indicationsRunning = metrics.some(m => m.engines.indications.running)
      const strategiesRunning = metrics.some(m => m.engines.strategies.running)

      console.log(`Indications Engine Active: ${indicationsRunning ? 'Yes' : 'No'}`)
      console.log(`Strategies Engine Active: ${strategiesRunning ? 'Yes' : 'No'}`)

      if (indicationsRunning || strategiesRunning) {
        const avgIndicationCycles = metrics.reduce((sum, m) => sum + m.engines.indications.cycleCount, 0) / metrics.length
        const avgStrategyCycles = metrics.reduce((sum, m) => sum + m.engines.strategies.cycleCount, 0) / metrics.length

        console.log(`Average Indication Cycles: ${Math.round(avgIndicationCycles)}`)
        console.log(`Average Strategy Cycles: ${Math.round(avgStrategyCycles)}`)
      }
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTest(): Promise<void> {
    try {
      // 1. Start dev server
      const serverStarted = await this.startDevServer()
      if (!serverStarted) {
        throw new Error('Failed to start dev server')
      }

      // 2. Wait for server to be ready
      const serverReady = await this.waitForServer()
      if (!serverReady) {
        throw new Error('Server failed to become ready')
      }

      // 3. Run initial tests
      console.log('\n🧪 Running comprehensive test suite...\n')

      this.results.push(await this.testSystemHealth())
      this.results.push(await this.testCompleteVerification())
      this.results.push(await this.testSystemMonitoring())
      this.results.push(await this.testPrehistoricData())
      this.results.push(await this.testIndicationsData())
      this.results.push(await this.testStrategiesData())
      this.results.push(await this.testProcessingMetrics())
      this.results.push(await this.testEngineMetrics())
      this.results.push(await this.testTradeEngineQuickStart())
      this.results.push(await this.testTradeEngineProgression())

      // 4. Monitor system for 1 minute after prehistoric processing
      console.log('\n⏱️ Starting 1-minute realtime monitoring...\n')
      const monitoringResults = await this.monitorSystem(60)
      this.results.push(...monitoringResults)

      // 5. Display results
      this.displayResults(this.results)

      console.log('\n🎉 Comprehensive test completed!\n')

    } catch (error) {
      console.error('❌ Test suite failed:', error)
      this.results.push({
        section: 'Test Suite',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      this.displayResults(this.results)
    } finally {
      this.stopDevServer()
    }
  }

  private async testTradeEngineProgression(): Promise<TestResult> {
    const startTime = Date.now()
    try {
      const result = await this.makeRequest('/api/trade-engine/progression')
      return {
        section: 'Trade Engine Progression',
        status: result.success ? 'PASS' : 'FAIL',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        section: 'Trade Engine Progression',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
}

// Run the test suite
const testRunner = new ComprehensiveTestRunner()
testRunner.runComprehensiveTest().catch(console.error)
