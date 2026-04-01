#!/usr/bin/env node

/**
 * System Performance Benchmark Suite
 * Measures performance of key system components
 */

interface BenchmarkResult {
  name: string
  operation: string
  iterations: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
  opsPerSecond: number
}

const benchmarkResults: BenchmarkResult[] = []

function benchmark(
  name: string,
  operation: string,
  fn: () => void | Promise<void>,
  iterations: number = 1000,
): BenchmarkResult {
  const times: number[] = []
  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    fn()
    const t1 = performance.now()
    times.push(t1 - t0)
  }

  const totalTime = performance.now() - start
  const result: BenchmarkResult = {
    name,
    operation,
    iterations,
    totalTime,
    avgTime: totalTime / iterations,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    opsPerSecond: (iterations / totalTime) * 1000,
  }

  benchmarkResults.push(result)
  return result
}

async function runBenchmarks() {
  console.log('\n⚡ CTS v3 System Performance Benchmark\n')
  console.log('═════════════════════════════════════════\n')

  // 1. JSON Operations
  console.log('📊 JSON Operations')
  console.log('───────────────────')

  const testObj = {
    id: '123',
    symbol: 'BTCUSDT',
    price: 45000.5,
    volume: 1234.5,
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'binance',
      type: 'market_data',
      verified: true,
    },
  }

  const serialized = JSON.stringify(testObj)

  const jsonSerialize = benchmark('JSON Serialize', 'stringify', () => {
    JSON.stringify(testObj)
  }, 10000)
  console.log(
    `  Serialize: ${jsonSerialize.avgTime.toFixed(4)}ms avg, ${jsonSerialize.opsPerSecond.toFixed(0)} ops/sec`,
  )

  const jsonDeserialize = benchmark('JSON Deserialize', 'parse', () => {
    JSON.parse(serialized)
  }, 10000)
  console.log(
    `  Deserialize: ${jsonDeserialize.avgTime.toFixed(4)}ms avg, ${jsonDeserialize.opsPerSecond.toFixed(0)} ops/sec`,
  )

  // 2. Array Operations
  console.log('\n📈 Array Operations')
  console.log('───────────────────')

  const testArray = Array(1000)
    .fill(0)
    .map((_, i) => ({
      id: i,
      value: Math.random(),
      timestamp: Date.now(),
    }))

  const arrayFilter = benchmark('Array Filter', 'filter 1000 items', () => {
    testArray.filter((item) => item.value > 0.5)
  }, 1000)
  console.log(`  Filter: ${arrayFilter.avgTime.toFixed(4)}ms avg, ${arrayFilter.opsPerSecond.toFixed(0)} ops/sec`)

  const arrayMap = benchmark('Array Map', 'map 1000 items', () => {
    testArray.map((item) => ({ ...item, doubled: item.value * 2 }))
  }, 1000)
  console.log(`  Map: ${arrayMap.avgTime.toFixed(4)}ms avg, ${arrayMap.opsPerSecond.toFixed(0)} ops/sec`)

  const arraySort = benchmark('Array Sort', 'sort 1000 items', () => {
    [...testArray].sort((a, b) => b.value - a.value)
  }, 100)
  console.log(`  Sort: ${arraySort.avgTime.toFixed(4)}ms avg, ${arraySort.opsPerSecond.toFixed(0)} ops/sec`)

  // 3. String Operations
  console.log('\n🔤 String Operations')
  console.log('────────────────────')

  const testString = 'BTCUSDT_1m_' + 'x'.repeat(100)

  const stringConcat = benchmark('String Concat', 'concatenate', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    'prefix_' + testString + '_suffix'
  }, 10000)
  console.log(
    `  Concatenate: ${stringConcat.avgTime.toFixed(4)}ms avg, ${stringConcat.opsPerSecond.toFixed(0)} ops/sec`,
  )

  const templateLiteral = benchmark('Template Literal', 'template string', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    `prefix_${testString}_suffix`
  }, 10000)
  console.log(
    `  Template: ${templateLiteral.avgTime.toFixed(4)}ms avg, ${templateLiteral.opsPerSecond.toFixed(0)} ops/sec`,
  )

  // 4. Map Operations
  console.log('\n🗺️  Map Operations')
  console.log('──────────────────')

  const testMap = new Map()
  for (let i = 0; i < 1000; i++) {
    testMap.set(`key_${i}`, Math.random())
  }

  const mapGet = benchmark('Map Get', 'get operation', () => {
    testMap.get('key_500')
  }, 10000)
  console.log(`  Get: ${mapGet.avgTime.toFixed(4)}ms avg, ${mapGet.opsPerSecond.toFixed(0)} ops/sec`)

  const mapSet = benchmark('Map Set', 'set operation', () => {
    const map = new Map(testMap)
    map.set('new_key', Math.random())
  }, 1000)
  console.log(`  Set: ${mapSet.avgTime.toFixed(4)}ms avg, ${mapSet.opsPerSecond.toFixed(0)} ops/sec`)

  // 5. Regex Operations
  console.log('\n🔍 Regex Operations')
  console.log('───────────────────')

  const testRegex = 'BTC_USDT_1m_12345_data.json'
  const pattern = /^([A-Z]+)_([A-Z]+)_(\d+[mhd])_/

  const regexMatch = benchmark('Regex Match', 'match operation', () => {
    pattern.test(testRegex)
  }, 10000)
  console.log(`  Match: ${regexMatch.avgTime.toFixed(4)}ms avg, ${regexMatch.opsPerSecond.toFixed(0)} ops/sec`)

  const regexSplit = benchmark('Regex Split', 'split operation', () => {
    testRegex.split('_')
  }, 10000)
  console.log(`  Split: ${regexSplit.avgTime.toFixed(4)}ms avg, ${regexSplit.opsPerSecond.toFixed(0)} ops/sec`)

  // 6. Object Operations
  console.log('\n📦 Object Operations')
  console.log('────────────────────')

  const objectSpread = benchmark('Object Spread', 'spread operation', () => {
    const newObj = { ...testObj, extra: 'value' }
  }, 10000)
  console.log(
    `  Spread: ${objectSpread.avgTime.toFixed(4)}ms avg, ${objectSpread.opsPerSecond.toFixed(0)} ops/sec`,
  )

  const objectKeys = benchmark('Object Keys', 'keys operation', () => {
    Object.keys(testObj)
  }, 10000)
  console.log(
    `  Keys: ${objectKeys.avgTime.toFixed(4)}ms avg, ${objectKeys.opsPerSecond.toFixed(0)} ops/sec`,
  )

  // Summary
  console.log('\n\n📊 Summary\n')
  console.log('═════════════════════════════════════════')

  // Find fastest and slowest
  const fastest = benchmarkResults.reduce((prev, current) => (prev.avgTime < current.avgTime ? prev : current))
  const slowest = benchmarkResults.reduce((prev, current) => (prev.avgTime > current.avgTime ? prev : current))

  console.log(`Fastest operation: ${fastest.name} (${fastest.avgTime.toFixed(4)}ms avg)`)
  console.log(`Slowest operation: ${slowest.name} (${slowest.avgTime.toFixed(4)}ms avg)`)

  // Calculate total throughput
  const totalOps = benchmarkResults.reduce((sum, r) => sum + r.opsPerSecond, 0)
  console.log(`\nTotal throughput (all ops): ${totalOps.toFixed(0)} ops/sec`)

  // Memory estimate
  console.log('\n\n💾 Memory Usage Estimate\n')
  console.log('─────────────────────────────────────────')

  const singleUpdateSize = JSON.stringify({
    id: '123',
    symbol: 'BTCUSDT',
    price: 45000.5,
    pnl: 1234.56,
    status: 'open',
  }).length

  const hourlyUpdates = 60 * 100 // 100 positions, updates every minute
  const dailyUpdatesSize = (hourlyUpdates * 24 * singleUpdateSize) / 1024 / 1024

  console.log(`Single update size: ${singleUpdateSize} bytes`)
  console.log(`Estimated daily (100 positions): ${dailyUpdatesSize.toFixed(2)} MB`)
  console.log(`Monthly estimate: ${(dailyUpdatesSize * 30).toFixed(0)} MB`)
  console.log(`Annual estimate: ${(dailyUpdatesSize * 365).toFixed(0)} MB`)

  console.log('\n✅ Benchmark Complete!\n')
}

runBenchmarks().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
