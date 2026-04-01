#!/usr/bin/env node

/**
 * Quick System Check
 * Verifies core system components are functional
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  CTS v3.1 - Quick System Check');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;
const results = [];

function check(name, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
      results.push({ name, status: 'PASS', message: '' });
    } else {
      console.log(`❌ ${name}`);
      failed++;
      results.push({ name, status: 'FAIL', message: 'Check returned false' });
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

// File Structure Checks
console.log('\n📁 File Structure Checks:\n');

check('Project root exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'package.json'));
});

check('Data directory exists', () => {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return fs.existsSync(dataDir);
});

check('API routes exist', () => {
  return fs.existsSync(path.join(__dirname, '..', 'app', 'api'));
});

check('Trade engine library exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'trade-engine'));
});

check('Exchange connectors exist', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'exchange-connectors'));
});

// Critical Files Check
console.log('\n📄 Critical Files Check:\n');

check('Database module exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'db.ts'));
});

check('File storage module exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'file-storage.ts'));
});

check('System logger exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'system-logger.ts'));
});

check('Trade engine manager exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'lib', 'trade-engine', 'engine-manager.ts'));
});

// API Routes Check
console.log('\n🔌 API Routes Check:\n');

const apiRoutes = [
  ['Connection test', 'app/api/settings/connections/[id]/test/route.ts'],
  ['Connection toggle', 'app/api/settings/connections/[id]/toggle/route.ts'],
  ['Trade engine start', 'app/api/trade-engine/start/route.ts'],
  ['Trade engine stop', 'app/api/trade-engine/stop/route.ts'],
  ['Trade engine status', 'app/api/trade-engine/status/route.ts'],
  ['Trade engine progression', 'app/api/trade-engine/progression/route.ts'],
  ['System monitoring', 'app/api/monitoring/system/route.ts'],
  ['Health check', 'app/api/system/health-check/route.ts'],
];

apiRoutes.forEach(([name, route]) => {
  check(name, () => {
    return fs.existsSync(path.join(__dirname, '..', route));
  });
});

// Configuration Files Check
console.log('\n⚙️  Configuration Check:\n');

check('Connections file initialization', () => {
  const connectionsPath = path.join(__dirname, '..', 'data', 'connections.json');
  if (!fs.existsSync(connectionsPath)) {
    fs.writeFileSync(connectionsPath, JSON.stringify([], null, 2));
  }
  return fs.existsSync(connectionsPath);
});

check('Settings file initialization', () => {
  const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      mainEngineIntervalMs: 1000,
      strategyUpdateIntervalMs: 300,
      minimumConnectInterval: 200
    };
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }
  return fs.existsSync(settingsPath);
});

// Summary
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✅ System check completed successfully!\n');
  process.exit(0);
} else {
  console.log('⚠️  System check found issues. Please review the results above.\n');
  process.exit(1);
}
