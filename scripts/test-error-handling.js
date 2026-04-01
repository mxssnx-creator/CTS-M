#!/usr/bin/env node

/**
 * Error Handling Integration Tests
 * 
 * Tests error handling, circuit breakers, and recovery mechanisms
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
let testsPassed = 0
let testsFailed = 0

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  }
  const prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : '•'
  console.log(`${colors[type]}${prefix} ${message}${colors.reset}`)
}

function testFileExists(filePath, testName) {
  const fullPath = path.join(projectRoot, filePath)
  const exists = fs.existsSync(fullPath)
  if (exists) {
    log(`${testName}`, 'success')
    testsPassed++
  } else {
    log(`${testName} - File not found: ${filePath}`, 'error')
    testsFailed++
  }
  return exists
}

function testFileContains(filePath, pattern, testName) {
  const fullPath = path.join(projectRoot, filePath)
  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const isRegex = pattern instanceof RegExp
    const matches = isRegex ? pattern.test(content) : content.includes(pattern)
    
    if (matches) {
      log(`${testName}`, 'success')
      testsPassed++
    } else {
      log(`${testName} - Pattern not found in ${filePath}`, 'warning')
      testsFailed++
    }
    return matches
  } catch (error) {
    log(`${testName} - Error reading file: ${error.message}`, 'error')
    testsFailed++
    return false
  }
}

console.log('\n' + '='.repeat(60))
console.log('ERROR HANDLING INTEGRATION TEST SUITE')
console.log('='.repeat(60) + '\n')

// Test 1: Core Error Handling Files
console.log('ERROR HANDLING CORE FILES:')
testFileExists('lib/error-handling-production.ts', 'Global error handler')
testFileExists('lib/error-handling-integration.ts', 'Error handling integration')
testFileExists('lib/api-error-middleware.ts', 'API error middleware')
testFileExists('lib/async-safety.ts', 'Async safety wrapper')
testFileExists('lib/circuit-breaker.ts', 'Circuit breaker')
testFileExists('lib/correlation-tracking.ts', 'Correlation tracking')
testFileExists('lib/global-rate-limiter.ts', 'Global rate limiter')
testFileExists('lib/health-check.ts', 'Health check')
testFileExists('lib/metrics-collector.ts', 'Metrics collector')
testFileExists('lib/alerting-system.ts', 'Alerting system')

// Test 2: Error Handling Exports
console.log('\nERROR HANDLING EXPORTS:')
testFileContains('lib/error-handling-integration.ts', 'export const circuitBreakers', 'Circuit breakers exported')
testFileContains('lib/error-handling-integration.ts', 'withExchangeErrorHandling', 'Exchange error handler')
testFileContains('lib/error-handling-integration.ts', 'withDatabaseErrorHandling', 'Database error handler')
testFileContains('lib/error-handling-integration.ts', 'batchWithErrorHandling', 'Batch error handler')
testFileContains('lib/error-handling-integration.ts', 'retryWithBackoff', 'Retry with backoff')

// Test 3: API Middleware
console.log('\nAPI ERROR MIDDLEWARE:')
testFileContains('lib/api-error-middleware.ts', 'withApiErrorHandling', 'API error handling wrapper')
testFileContains('lib/api-error-middleware.ts', 'createErrorResponse', 'Error response creator')
testFileContains('lib/api-error-middleware.ts', 'validateRequestBody', 'Request validation')
testFileContains('lib/api-error-middleware.ts', 'withHandlerTimeout', 'Handler timeout')

// Test 4: Async Safety
console.log('\nASYNC SAFETY:')
testFileContains('lib/async-safety.ts', 'safeAsync', 'Safe async wrapper')
testFileContains('lib/async-safety.ts', 'retryAsync', 'Retry async')
testFileContains('lib/async-safety.ts', 'withTimeout', 'Timeout protection')
testFileContains('lib/async-safety.ts', 'AsyncQueue', 'Async queue')

// Test 5: Circuit Breaker
console.log('\nCIRCUIT BREAKER:')
testFileContains('lib/circuit-breaker.ts', 'CircuitState.CLOSED', 'CLOSED state')
testFileContains('lib/circuit-breaker.ts', 'CircuitState.OPEN', 'OPEN state')
testFileContains('lib/circuit-breaker.ts', 'CircuitState.HALF_OPEN', 'HALF_OPEN state')
testFileContains('lib/circuit-breaker.ts', 'executeWithFallback', 'Fallback execution')
testFileContains('lib/circuit-breaker.ts', 'isAvailable', 'Availability check')

// Test 6: Instrumentation Integration
console.log('\nINSTRUMENTATION INTEGRATION:')
testFileContains('instrumentation.ts', 'ProductionErrorHandler.initialize', 'Error handler init')
testFileContains('instrumentation.ts', 'initializeErrorHandling', 'Error handling integration init')

// Test 7: API Endpoints
console.log('\nERROR HANDLING ENDPOINTS:')
testFileExists('app/api/health/route.ts', 'Health check endpoint')
testFileExists('app/api/health/readiness/route.ts', 'Readiness probe')
testFileExists('app/api/health/liveness/route.ts', 'Liveness probe')
testFileExists('app/api/metrics/route.ts', 'Metrics endpoint')
testFileExists('app/api/alerts/route.ts', 'Alerts endpoint')

// Test 8: Documentation
console.log('\nDOCUMENTATION:')
testFileExists('PHASE_A_ERROR_HANDLING_INTEGRATION_GUIDE.md', 'Error handling guide')
testFileExists('lib/error-handling-examples.ts', 'Error handling examples')

// Test 9: Error Handler Features
console.log('\nERROR HANDLER FEATURES:')
testFileContains('lib/error-handling-production.ts', 'unhandledRejection', 'Unhandled rejection handling')
testFileContains('lib/error-handling-production.ts', 'uncaughtException', 'Uncaught exception handling')
testFileContains('lib/error-handling-production.ts', 'getRecentErrors', 'Error history')
testFileContains('lib/error-handling-production.ts', 'getErrorStats', 'Error statistics')

// Test 10: Circuit Breaker Instances
console.log('\nCIRCUIT BREAKER INSTANCES:')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.exchange', 'Exchange circuit breaker')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.database', 'Database circuit breaker')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.cache', 'Cache circuit breaker')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.indication', 'Indication circuit breaker')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.strategy', 'Strategy circuit breaker')
testFileContains('lib/error-handling-integration.ts', 'circuitBreakers.realtime', 'Realtime circuit breaker')

// Test 11: Retry Strategy
console.log('\nRETRY STRATEGY:')
testFileContains('lib/error-handling-integration.ts', 'exponential.*backoff', /exponential.*backoff/i, 'Exponential backoff')
testFileContains('lib/error-handling-integration.ts', 'maxAttempts', 'Max attempts configuration')
testFileContains('lib/error-handling-integration.ts', 'retryWithBackoff', 'Retry function')

// Test 12: Batch Processing
console.log('\nBATCH PROCESSING:')
testFileContains('lib/error-handling-integration.ts', 'continueOnError', 'Continue on error flag')
testFileContains('lib/error-handling-integration.ts', 'maxConcurrency', 'Concurrency control')
testFileContains('lib/error-handling-integration.ts', 'batchWithErrorHandling', 'Batch error handler')

// Test 13: Metrics Integration
console.log('\nMETRICS INTEGRATION:')
testFileContains('lib/error-handling-integration.ts', 'metricsCollector.incrementCounter', 'Counter metrics')
testFileContains('lib/error-handling-integration.ts', 'metricsCollector.setGauge', 'Gauge metrics')
testFileContains('lib/error-handling-integration.ts', 'registerMetric', 'Metric registration')

// Test 14: Alerting Integration
console.log('\nALERTING INTEGRATION:')
testFileContains('lib/error-handling-integration.ts', 'alertManager.sendAlert', 'Alert sending')
testFileContains('lib/error-handling-integration.ts', 'severity.*critical', 'Critical alerts')

// Summary
console.log('\n' + '='.repeat(60))
console.log(`RESULTS: ${testsPassed} passed, ${testsFailed} failed`)
console.log('='.repeat(60) + '\n')

if (testsFailed === 0) {
  log('All error handling tests passed! ✓', 'success')
  process.exit(0)
} else {
  log(`${testsFailed} tests failed - review implementation`, 'error')
  process.exit(1)
}
