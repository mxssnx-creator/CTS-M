#!/usr/bin/env node

/**
 * API Integration Test
 * Tests all critical API endpoints for proper functionality
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

console.log('═══════════════════════════════════════════════════════════');
console.log('  CTS v3.1 - API Integration Test');
console.log('  Testing against:', BASE_URL);
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;
const results = [];

async function testEndpoint(name, method, path, body = null, expectedStatus = 200) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    };

    const startTime = Date.now();

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode === expectedStatus;

        if (success) {
          console.log(`✅ ${name} (${duration}ms)`);
          passed++;
        } else {
          console.log(`❌ ${name}`);
          console.log(`   Expected: ${expectedStatus}, Got: ${res.statusCode}`);
          failed++;
        }

        results.push({
          name,
          method,
          path,
          status: success ? 'PASS' : 'FAIL',
          statusCode: res.statusCode,
          expectedStatus,
          duration,
          response: data ? JSON.parse(data) : null
        });

        resolve();
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;

      results.push({
        name,
        method,
        path,
        status: 'FAIL',
        error: error.message,
        duration
      });

      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${name}`);
      console.log(`   Error: Request timeout`);
      failed++;

      results.push({
        name,
        method,
        path,
        status: 'FAIL',
        error: 'Timeout',
        duration: TIMEOUT
      });

      resolve();
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing Monitoring Endpoints:\n');

  await testEndpoint(
    'Health Check',
    'GET',
    '/api/system/health-check'
  );

  await testEndpoint(
    'Comprehensive Monitoring',
    'GET',
    '/api/monitoring/comprehensive'
  );

  await testEndpoint(
    'System States',
    'GET',
    '/api/monitoring/system'
  );

  console.log('\n🔍 Testing Trade Engine Endpoints:\n');

  await testEndpoint(
    'Engine Status (All)',
    'GET',
    '/api/trade-engine/status'
  );

  await testEndpoint(
    'Engine Progression',
    'GET',
    '/api/trade-engine/progression'
  );

  // Note: Start/Stop tests require valid connection ID
  // Uncomment and update with actual connection ID to test
  /*
  await testEndpoint(
    'Engine Start',
    'POST',
    '/api/trade-engine/start',
    { connectionId: 'your-connection-id' }
  );

  await testEndpoint(
    'Engine Stop',
    'POST',
    '/api/trade-engine/stop',
    { connectionId: 'your-connection-id' }
  );
  */

  console.log('\n🔍 Testing Connection Endpoints:\n');

  // Note: These tests require actual connection IDs
  // Update with valid connection ID from your system
  /*
  await testEndpoint(
    'Connection Test',
    'POST',
    '/api/settings/connections/your-id/test'
  );

  await testEndpoint(
    'Connection Toggle',
    'POST',
    '/api/settings/connections/your-id/toggle',
    { is_enabled: true, is_live_trade: false }
  );
  */

  console.log('\n🔍 Testing Error Handling:\n');

  await testEndpoint(
    'Invalid Engine Start (No Body)',
    'POST',
    '/api/trade-engine/start',
    null,
    400
  );

  await testEndpoint(
    'Invalid Engine Stop (No Body)',
    'POST',
    '/api/trade-engine/stop',
    null,
    400
  );

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Detailed results
  if (process.env.VERBOSE === 'true') {
    console.log('\n📊 Detailed Results:\n');
    console.log(JSON.stringify(results, null, 2));
  }

  // Performance summary
  const successfulTests = results.filter(r => r.status === 'PASS');
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const maxDuration = Math.max(...successfulTests.map(r => r.duration));
    const minDuration = Math.min(...successfulTests.map(r => r.duration));

    console.log('⚡ Performance Summary:');
    console.log(`   Average response time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Fastest: ${minDuration}ms`);
    console.log(`   Slowest: ${maxDuration}ms\n`);
  }

  if (failed === 0) {
    console.log('✅ All API tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some API tests failed. Please review the results above.\n');
    console.log('💡 Tips:');
    console.log('   - Ensure the application is running');
    console.log('   - Check that the database is accessible');
    console.log('   - Verify configuration files are present');
    console.log('   - Review application logs for errors\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error);
  process.exit(1);
});
