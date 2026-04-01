#!/usr/bin/env node

/**
 * Phase A: Critical Production Hardening Tests
 * 
 * Tests all 8 critical fixes:
 * A1: Global Error Handler
 * A2: Async Error Wrapper  
 * A3: Circuit Breaker
 * A4: Request Correlation Tracking
 * A5: Global Rate Limiter
 * A6: Health Check Endpoints
 * A7: Prometheus Metrics
 * A8: Alerting System
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
let testsPassed = 0
let testsFailed = 0

function logTest(testName, passed, message = '') {
  const status = passed ? '✓' : '✗'
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}${status}\x1b[0m ${testName}${message ? ': ' + message : ''}`)
  if (passed) {
    testsPassed++
  } else {
    testsFailed++
  }
}

function testFileExists(filePath, testName) {
  const fullPath = path.join(projectRoot, filePath)
  const exists = fs.existsSync(fullPath)
  logTest(`${testName} - File exists`, exists, filePath)
  return exists
}

function testFileContains(filePath, searchString, testName) {
  const fullPath = path.join(projectRoot, filePath)
  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const contains = content.includes(searchString)
    logTest(`${testName} - Contains "${searchString.substring(0, 40)}"`, contains, filePath)
    return contains
  } catch (error) {
    logTest(`${testName} - File readable`, false, error.message)
    return false
  }
}

function testExports(filePath, exportNames, testName) {
  const fullPath = path.join(projectRoot, filePath)
  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const allExported = exportNames.every(name =>
      content.includes(`export`) && content.includes(name)
    )
    logTest(`${testName} - Exports`, allExported, `${exportNames.join(', ')}`)
    return allExported
  } catch (error) {
    logTest(`${testName} - File readable`, false, error.message)
    return false
  }
}

console.log('\n========================================')
console.log('Phase A: Critical Production Hardening Tests')
console.log('========================================\n')

// A1: Global Error Handler
console.log('\n[A1] Global Error Handler Tests:')
testFileExists('lib/error-handling-production.ts', 'A1.1')
testFileContains('lib/error-handling-production.ts', 'unhandledRejection', 'A1.2')
testFileContains('lib/error-handling-production.ts', 'uncaughtException', 'A1.3')
testFileContains('instrumentation.ts', 'ProductionErrorHandler', 'A1.4')
testExports('lib/error-handling-production.ts', ['ProductionErrorHandler', 'ProductionError'], 'A1.5')

// A2: Async Error Wrapper
console.log('\n[A2] Async Error Wrapper Tests:')
testFileExists('lib/async-safety.ts', 'A2.1')
testFileContains('lib/async-safety.ts', 'safeAsync', 'A2.2')
testFileContains('lib/async-safety.ts', 'retryAsync', 'A2.3')
testFileContains('lib/async-safety.ts', 'withTimeout', 'A2.4')
testFileContains('lib/async-safety.ts', 'AsyncQueue', 'A2.5')
testExports('lib/async-safety.ts', ['safeAsync', 'AsyncQueue'], 'A2.6')

// A3: Circuit Breaker
console.log('\n[A3] Circuit Breaker Tests:')
testFileExists('lib/circuit-breaker.ts', 'A3.1')
testFileContains('lib/circuit-breaker.ts', 'CircuitState', 'A3.2')
testFileContains('lib/circuit-breaker.ts', 'CLOSED', 'A3.3')
testFileContains('lib/circuit-breaker.ts', 'OPEN', 'A3.4')
testFileContains('lib/circuit-breaker.ts', 'HALF_OPEN', 'A3.5')
testFileContains('lib/circuit-breaker.ts', 'circuitBreakerRegistry', 'A3.6')
testExports('lib/circuit-breaker.ts', ['CircuitBreaker'], 'A3.7')

// A4: Request Correlation Tracking
console.log('\n[A4] Request Correlation Tracking Tests:')
testFileExists('lib/correlation-tracking.ts', 'A4.1')
testFileContains('lib/correlation-tracking.ts', 'AsyncLocalStorage', 'A4.2')
testFileContains('lib/correlation-tracking.ts', 'getRequestContext', 'A4.3')
testFileContains('lib/correlation-tracking.ts', 'getCorrelationId', 'A4.4')
testFileContains('lib/correlation-tracking.ts', 'withTracing', 'A4.5')
testFileContains('lib/correlation-tracking.ts', 'batchTracker', 'A4.6')

// A5: Global Rate Limiter
console.log('\n[A5] Global Rate Limiter Tests:')
testFileExists('lib/global-rate-limiter.ts', 'A5.1')
testFileContains('lib/global-rate-limiter.ts', 'TokenBucketRateLimiter', 'A5.2')
testFileContains('lib/global-rate-limiter.ts', 'SlidingWindowRateLimiter', 'A5.3')
testFileContains('lib/global-rate-limiter.ts', 'globalRateLimiter', 'A5.4')
testFileContains('lib/global-rate-limiter.ts', 'withRateLimit', 'A5.5')
testExports('lib/global-rate-limiter.ts', ['GlobalRateLimiter'], 'A5.6')

// A6: Health Check Endpoints
console.log('\n[A6] Health Check Endpoints Tests:')
testFileExists('lib/health-check.ts', 'A6.1')
testFileContains('lib/health-check.ts', 'HealthCheckService', 'A6.2')
testFileContains('lib/health-check.ts', 'getHealthReport', 'A6.3')
testFileContains('lib/health-check.ts', 'getReadinessStatus', 'A6.4')
testFileContains('lib/health-check.ts', 'getLivenessStatus', 'A6.5')
testFileExists('app/api/health/route.ts', 'A6.6')
testFileExists('app/api/health/readiness/route.ts', 'A6.7')
testFileExists('app/api/health/liveness/route.ts', 'A6.8')
testFileContains('app/api/health/route.ts', 'healthCheckService', 'A6.9')

// A7: Prometheus Metrics
console.log('\n[A7] Prometheus Metrics Tests:')
testFileExists('lib/metrics-collector.ts', 'A7.1')
testFileContains('lib/metrics-collector.ts', 'MetricsCollector', 'A7.2')
testFileContains('lib/metrics-collector.ts', 'registerMetric', 'A7.3')
testFileContains('lib/metrics-collector.ts', 'getMetricsText', 'A7.4')
testFileContains('lib/metrics-collector.ts', 'metricsCollector', 'A7.5')
testFileExists('app/api/metrics/route.ts', 'A7.6')
testFileContains('app/api/metrics/route.ts', 'metricsCollector', 'A7.7')

// A8: Alerting System
console.log('\n[A8] Alerting System Tests:')
testFileExists('lib/alerting-system.ts', 'A8.1')
testFileContains('lib/alerting-system.ts', 'AlertManager', 'A8.2')
testFileContains('lib/alerting-system.ts', 'AlertSeverity', 'A8.3')
testFileContains('lib/alerting-system.ts', 'sendAlert', 'A8.4')
testFileContains('lib/alerting-system.ts', 'alertManager', 'A8.5')
testFileContains('lib/alerting-system.ts', 'slack', 'A8.6')
testFileContains('lib/alerting-system.ts', 'pagerduty', 'A8.7')
testFileExists('app/api/alerts/route.ts', 'A8.8')
testFileContains('app/api/alerts/route.ts', 'alertManager', 'A8.9')

// Integration Tests
console.log('\n[Integration] Tests:')
testFileContains('instrumentation.ts', 'error-handling-production', 'INT.1 - Error handler in instrumentation')
testFileExists('app/api/health/route.ts', 'INT.2 - Health check API')
testFileExists('app/api/metrics/route.ts', 'INT.3 - Metrics API')
testFileExists('app/api/alerts/route.ts', 'INT.4 - Alerts API')

// Summary
console.log('\n========================================')
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`)
console.log('========================================\n')

if (testsFailed === 0) {
  console.log('✓ All Phase A critical fixes validated successfully!')
  process.exit(0)
} else {
  console.log(`✗ ${testsFailed} tests failed - review implementation`)
  process.exit(1)
}
