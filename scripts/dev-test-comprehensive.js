#!/usr/bin/env node

/**
 * Comprehensive Dev Mode Test Script
 * Tests complete progress, quickstart, engine processings and counts for prehistoric data,
 * processings, results, ratios, indications with results, strategies with results,
 * database loads, server loads, and overall infos for processed data.
 *
 * Shows detailed results after prehistoric processed + 1min realtime progress.
 */

const { spawn } = require('child_process')
const http = require('http')

class TestResult {
  constructor(section, status, data = null, error = null, duration = null) {
    this.section = section
    this.status = status
    this.data = data
    this.error = error
    this.duration = duration
  }
}

class ComprehensiveTestRunner {
  constructor() {
    this.devProcess = null
    this.results = []
    this.startTime = new Date()
    this.baseUrl = 'http://localhost:3001'
  }

  /**
   * Make HTTP request to API endpoint
   */
  makeRequest(path, method = 'GET', body = null, timeout = 5000) {
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

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk.toString())
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (e) {
            resolve(data)
          }
        })
      })

      req.on('error', (error) => reject(error))
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
  async waitForServer(maxWaitSeconds = 60) {
    console.log('⏳ Waiting for dev server to start...')

    for (let i = 0; i < maxWaitSeconds; i++) {
      try {
        await this.makeRequest('/api/system/health', 'GET', null, 1000)
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
  async startDevServer() {
    console.log('🔧 Starting Next.js dev server...')

    try {
      await this.makeRequest('/api/system/health', 'GET', null, 1000)
      console.log('✅ Dev server is already running, skipping start')
      return true
    } catch (error) {
      console.log('ℹ️ No external dev server detected; relying on existing sandbox runtime only')
      return true
    }
  }

  /**
   * Stop dev server
   */
  stopDevServer() {
    if (this.devProcess) {
      console.log('🛑 Stopping dev server...')
      this.devProcess.kill('SIGTERM')
      this.devProcess = null
    }
  }

  /**
   * Test system health
   */
  async testSystemHealth() {
    const startTime = Date.now()

    try {
      console.log('🔍 Testing system health...')
      const health = await this.makeRequest('/api/system/health')

      return new TestResult(
        'System Health',
        health.status === 'healthy' ? 'PASS' : 'WARN',
        health,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'System Health',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test complete system verification
   */
  async testCompleteVerification() {
    const startTime = Date.now()

    try {
      console.log('🔍 Testing complete system verification...')
      const result = await this.makeRequest('/api/system/verify-complete')

      return new TestResult(
        'Complete Verification',
        result.status === 'success' ? 'PASS' : result.status === 'partial' ? 'WARN' : 'FAIL',
        result,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Complete Verification',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test system monitoring
   */
  async testSystemMonitoring() {
    const startTime = Date.now()

    try {
      console.log('📊 Testing system monitoring...')
      const monitoring = await this.makeRequest('/api/system/monitoring')

      return new TestResult(
        'System Monitoring',
        'PASS',
        monitoring,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'System Monitoring',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test prehistoric data verification
   */
  async testPrehistoricData() {
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
        console.log('   Symbol data load initiated:', loadResult ? 'OK' : 'Failed')
      } catch (e) {
        console.log('   Symbol data load not available or failed, continuing...')
      }

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Verify engine status (includes prehistoric data)
      const result = await this.makeRequest('/api/system/verify-engine')

      return new TestResult(
        'Prehistoric Data',
        result.verification?.allPhasesPassing ? 'PASS' : 'WARN',
        result,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Prehistoric Data',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test indications data
   */
  async testIndicationsData() {
    const startTime = Date.now()

    try {
      console.log('📊 Testing indications data...')
      const result = await this.makeRequest('/api/data/indications?connectionId=demo-mode')

      return new TestResult(
        'Indications Data',
        result.success ? 'PASS' : 'FAIL',
        {
          count: result.count,
          isDemo: result.isDemo,
          sample: result.data?.slice(0, 3)
        },
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Indications Data',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test strategies data
   */
  async testStrategiesData() {
    const startTime = Date.now()

    try {
      console.log('🎯 Testing strategies data...')
      const result = await this.makeRequest('/api/data/strategies?connectionId=demo-mode')

      return new TestResult(
        'Strategies Data',
        result.success ? 'PASS' : 'FAIL',
        {
          count: result.count,
          isDemo: result.isDemo,
          sample: result.data?.slice(0, 3)
        },
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Strategies Data',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test processing metrics
   */
  async testProcessingMetrics() {
    const startTime = Date.now()

    try {
      console.log('⚙️ Testing processing metrics...')
      const result = await this.makeRequest('/api/metrics/processing?connectionId=demo-mode')

      return new TestResult(
        'Processing Metrics',
        result.success ? 'PASS' : 'WARN',
        result.data,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Processing Metrics',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test engine metrics
   */
  async testEngineMetrics() {
    const startTime = Date.now()

    try {
      console.log('🚀 Testing engine metrics...')
      const result = await this.makeRequest('/api/engine-metrics')

      return new TestResult(
        'Engine Metrics',
        'PASS',
        result,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Engine Metrics',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Test trade engine quick start
   */
  async testTradeEngineQuickStart() {
    const startTime = Date.now()

    try {
      console.log('⚡ Testing trade engine quick start...')
      const result = await this.makeRequest('/api/trade-engine/quick-start')

      return new TestResult(
        'Trade Engine Quick Start',
        result.success ? 'PASS' : 'WARN',
        result,
        null,
        Date.now() - startTime
      )
    } catch (error) {
      return new TestResult(
        'Trade Engine Quick Start',
        'FAIL',
        null,
        error.message,
        Date.now() - startTime
      )
    }
  }

  /**
   * Monitor system for specified duration
   */
  async monitorSystem(durationSeconds) {
    console.log(`⏱️ Monitoring system for ${durationSeconds} seconds...`)

    const monitoringResults = []
    const startTime = Date.now()
    const endTime = startTime + (durationSeconds * 1000)

    while (Date.now() < endTime) {
      const monitoringStart = Date.now()
      try {
        const monitoring = await this.makeRequest('/api/system/monitoring')
        monitoringResults.push(new TestResult(
          'Realtime Monitoring',
          'PASS',
          monitoring,
          null,
          Date.now() - monitoringStart
        ))
      } catch (error) {
        monitoringResults.push(new TestResult(
          'Realtime Monitoring',
          'FAIL',
          null,
          error.message,
          Date.now() - monitoringStart
        ))
      }

      // Wait 5 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return monitoringResults
  }

  /**
   * Display detailed results
   */
  displayResults(results) {
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

      const metrics = monitoringResults.map(r => r.data)

      // CPU and Memory trends
      const avgCpu = metrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / metrics.length
      const avgMemory = metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length
      const maxCpu = Math.max(...metrics.map(m => m.cpu || 0))
      const maxMemory = Math.max(...metrics.map(m => m.memory || 0))

      console.log(`Average CPU Usage: ${avgCpu.toFixed(1)}%`)
      console.log(`Peak CPU Usage: ${maxCpu}%`)
      console.log(`Average Memory Usage: ${avgMemory.toFixed(1)}%`)
      console.log(`Peak Memory Usage: ${maxMemory}%`)

      // Database metrics
      const avgKeys = metrics.reduce((sum, m) => sum + (m.database?.keys || 0), 0) / metrics.length
      const avgRequests = metrics.reduce((sum, m) => sum + (m.database?.requestsPerSecond || 0), 0) / metrics.length

      console.log(`Average Database Keys: ${Math.round(avgKeys)}`)
      console.log(`Average Redis Requests/sec: ${avgRequests.toFixed(1)}`)

      // Engine status
      const indicationsRunning = metrics.some(m => m.engines?.indications?.running)
      const strategiesRunning = metrics.some(m => m.engines?.strategies?.running)

      console.log(`Indications Engine Active: ${indicationsRunning ? 'Yes' : 'No'}`)
      console.log(`Strategies Engine Active: ${strategiesRunning ? 'Yes' : 'No'}`)

      if (indicationsRunning || strategiesRunning) {
        const avgIndicationCycles = metrics.reduce((sum, m) => sum + (m.engines?.indications?.cycleCount || 0), 0) / metrics.length
        const avgStrategyCycles = metrics.reduce((sum, m) => sum + (m.engines?.strategies?.cycleCount || 0), 0) / metrics.length

        console.log(`Average Indication Cycles: ${Math.round(avgIndicationCycles)}`)
        console.log(`Average Strategy Cycles: ${Math.round(avgStrategyCycles)}`)
      }
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTest() {
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

      // 4. Monitor system for 1 minute after prehistoric processing
      console.log('\n⏱️ Starting 1-minute realtime monitoring...\n')
      const monitoringResults = await this.monitorSystem(60)
      this.results.push(...monitoringResults)

      // 5. Display results
      this.displayResults(this.results)

      console.log('\n🎉 Comprehensive test completed!\n')

    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
      this.results.push(new TestResult(
        'Test Suite',
        'FAIL',
        null,
        error.message
      ))
      this.displayResults(this.results)
    } finally {
      this.stopDevServer()
    }
  }
}

// Run the test suite
const testRunner = new ComprehensiveTestRunner()
testRunner.runComprehensiveTest().catch(console.error)
