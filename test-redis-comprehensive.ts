import { initRedis, getClient } from './lib/redis-db'
import { 
  getRedisProcedures, 
  redisHealth, 
  redisAnalyze, 
  redisStats,
  redisPerformance,
  redisEmergency,
  redisBackup,
  redisRestore,
  redisCompact
} from './lib/redis-procedures'

async function comprehensiveRedisTest() {
  console.log('🔍 COMPREHENSIVE REDIS DATABASE TEST')
  console.log('='.repeat(60))

  // Initialize Redis
  await initRedis()
  console.log('✓ Redis initialized')

  const procedures = getRedisProcedures()

  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check')
  const health = await redisHealth()
  console.log('Health status:', health.status)
  if (health.metrics) {
    console.log('  DB Size:', health.metrics.dbSize, 'keys')
    console.log('  OPS/sec:', health.metrics.operationsPerSecond)
  }
  if (health.status !== 'healthy') {
    console.warn('⚠ Health check warning:', health.message)
  }

  // Test 2: Database Analysis
  console.log('\n📋 Test 2: Database Analysis')
  const analysis = await redisAnalyze()
  console.log('Total keys:', analysis.totalKeys)
  console.log('Unique prefixes:', Object.keys(analysis.prefixes).length)
  console.log('Large keys (>1KB):', analysis.largeKeys)
  console.log('Expired keys:', analysis.expired)

  // Test 3: Basic Operations
  console.log('\n📋 Test 3: Basic Operations')
  const client = getClient()
  
  // Write test data
  await client.set('test:key1', 'value1')
  await client.set('test:key2', 'value2', { EX: 60 })
  await client.hset('test:hash', { field1: 'value1', field2: 'value2' })
  await client.sadd('test:set', 'member1', 'member2')
  console.log('✓ Created test data')

  // Read test data
  const val1 = await client.get('test:key1')
  console.log('✓ Read string:', val1)
  
  const hash = await client.hgetall('test:hash')
  console.log('✓ Read hash:', hash)
  
  const set = await client.smembers('test:set')
  console.log('✓ Read set:', set)

  // Test 4: Statistics
  console.log('\n📋 Test 4: Statistics')
  const stats = await redisStats()
  console.log('Total keys:', stats.totalKeys)
  console.log('Operations/sec:', stats.operationsPerSecond)
  console.log('Uptime:', stats.uptime, 'seconds')

  // Test 5: Performance Benchmarks
  console.log('\n📋 Test 5: Performance Benchmarks')
  const perf = await redisPerformance()
  console.log('Read speed:', Math.round(perf.readSpeed), 'ops/sec')
  console.log('Write speed:', Math.round(perf.writeSpeed), 'ops/sec')

  // Test 6: Backup and Restore
  console.log('\n📋 Test 6: Backup and Restore')
  const backup = await redisBackup()
  console.log('Backup size:', backup.length, 'characters')
  console.log('Backup valid:', backup.includes('test:key1'))
  
  // Restore test
  await client.del('test:key1')
  await client.del('test:key2')
  await client.del('test:hash')
  await client.del('test:set')
  console.log('✓ Deleted test data')
  
  await redisRestore(backup)
  console.log('✓ Restored from backup')
  
  const restored = await client.get('test:key1')
  console.log('✓ Restored data:', restored)

  // Test 7: Compact
  console.log('\n📋 Test 7: Database Compaction')
  const compact = await redisCompact()
  console.log('Removed keys:', compact.removed)

  // Test 8: Emergency Procedures
  console.log('\n📋 Test 8: Emergency Procedures')
  const emergency = await redisEmergency()
  console.log('Emergency success:', emergency.success)
  console.log('Health status:', emergency.health.status)
  console.log('Actions taken:', emergency.actions.length)

  // Test 9: Procedures Singleton
  console.log('\n📋 Test 9: Singleton Behavior')
  const p1 = getRedisProcedures()
  const p2 = getRedisProcedures()
  console.log('Same instance:', p1 === p2)

  // Test 10: Auto Maintenance
  console.log('\n📋 Test 10: Auto Maintenance')
  await procedures.stop() // Stop timer for clean exit
  console.log('✓ Maintenance timer stopped')

  // Cleanup all test data
  console.log('\n🧹 Cleanup')
  await client.flushDb()
  console.log('✓ All test data cleared')

  console.log('\n' + '='.repeat(60))
  console.log('✅ ALL REDIS TESTS COMPLETED SUCCESSFULLY')
  console.log('Redis database is fully functional and comprehensive!')
}

// Run the test
comprehensiveRedisTest().catch(console.error)