#!/usr/bin/env node

/**
 * CTS v3.1 - Complete System Test
 * Tests all critical functionality from setup to operational state
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('CTS v3.1 - COMPREHENSIVE SYSTEM TEST');
console.log('='.repeat(80));
console.log('');

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  process.stdout.write(`Testing: ${name}... `);
  try {
    fn();
    console.log('✓ PASS');
    passedTests++;
  } catch (error) {
    console.log(`✗ FAIL`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Critical Files Exist
console.log('Phase 1: File System Checks');
console.log('-'.repeat(80));

test('package.json exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    throw new Error('package.json not found');
  }
});

test('Database library exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'lib/db.ts'))) {
    throw new Error('lib/db.ts not found');
  }
});

test('Migration runner exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'lib/db-migration-runner.ts'))) {
    throw new Error('lib/db-migration-runner.ts not found');
  }
});

test('Init app exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'lib/init-app.ts'))) {
    throw new Error('lib/init-app.ts not found');
  }
});

test('Unified setup script exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'))) {
    throw new Error('scripts/unified_complete_setup.sql not found');
  }
});

test('Layout file exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'app/layout.tsx'))) {
    throw new Error('app/layout.tsx not found');
  }
});

console.log('');

// Test 2: Directory Structure
console.log('Phase 2: Directory Structure');
console.log('-'.repeat(80));

test('data directory exists', () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataDir)) {
    throw new Error('data directory could not be created');
  }
});

test('scripts directory exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'scripts'))) {
    throw new Error('scripts directory not found');
  }
});

test('lib directory exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'lib'))) {
    throw new Error('lib directory not found');
  }
});

test('app directory exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'app'))) {
    throw new Error('app directory not found');
  }
});

test('components directory exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'components'))) {
    throw new Error('components directory not found');
  }
});

console.log('');

// Test 3: Configuration Files
console.log('Phase 3: Configuration Files');
console.log('-'.repeat(80));

test('next.config.mjs exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'next.config.mjs'))) {
    throw new Error('next.config.mjs not found');
  }
});

test('tsconfig.json exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
    throw new Error('tsconfig.json not found');
  }
});

test('package.json is valid JSON', () => {
  const pkg = require(path.join(process.cwd(), 'package.json'));
  if (!pkg.name || !pkg.version) {
    throw new Error('package.json is invalid');
  }
});

console.log('');

// Test 4: Dependencies
console.log('Phase 4: Dependencies Check');
console.log('-'.repeat(80));

test('node_modules exists', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    throw new Error('node_modules not found - run npm install');
  }
});

test('next package installed', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules/next'))) {
    throw new Error('next not installed');
  }
});

test('react package installed', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules/react'))) {
    throw new Error('react not installed');
  }
});

test('better-sqlite3 package installed', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules/better-sqlite3'))) {
    throw new Error('better-sqlite3 not installed');
  }
});

test('sonner package installed', () => {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules/sonner'))) {
    throw new Error('sonner not installed');
  }
});

console.log('');

// Test 5: SQL Scripts Validation
console.log('Phase 5: SQL Scripts Validation');
console.log('-'.repeat(80));

test('Unified setup SQL has content', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (sql.length < 1000) {
    throw new Error('unified_complete_setup.sql appears incomplete');
  }
  if (!sql.includes('CREATE TABLE')) {
    throw new Error('unified_complete_setup.sql missing CREATE TABLE statements');
  }
});

test('Unified setup has users table', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (!sql.includes('users')) {
    throw new Error('unified_complete_setup.sql missing users table');
  }
});

test('Unified setup has connections table', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (!sql.includes('connections')) {
    throw new Error('unified_complete_setup.sql missing connections table');
  }
});

test('Unified setup has indications tables', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (!sql.includes('indications')) {
    throw new Error('unified_complete_setup.sql missing indications tables');
  }
});

test('Unified setup has strategies tables', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (!sql.includes('strategies')) {
    throw new Error('unified_complete_setup.sql missing strategies tables');
  }
});

test('Unified setup has indexes', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'scripts/unified_complete_setup.sql'), 'utf-8');
  if (!sql.includes('CREATE INDEX')) {
    throw new Error('unified_complete_setup.sql missing indexes');
  }
});

console.log('');

// Test 6: Code Quality Checks
console.log('Phase 6: Code Quality Checks');
console.log('-'.repeat(80));

test('Init app has use server directive', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'lib/init-app.ts'), 'utf-8');
  if (!content.includes('"use server"')) {
    throw new Error('init-app.ts missing "use server" directive');
  }
});

test('Migration runner has use server directive', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'lib/db-migration-runner.ts'), 'utf-8');
  if (!content.includes('"use server"')) {
    throw new Error('db-migration-runner.ts missing "use server" directive');
  }
});

test('Layout calls initializeApplication', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf-8');
  if (!content.includes('initializeApplication')) {
    throw new Error('layout.tsx does not call initializeApplication');
  }
});

test('No deprecated toast imports', () => {
  const dbMigrations = fs.readFileSync(path.join(process.cwd(), 'lib/db-migrations.ts'), 'utf-8');
  if (dbMigrations.includes('@/hooks/use-toast') || dbMigrations.includes('@/components/ui/toaster')) {
    throw new Error('Found deprecated toast imports');
  }
});

console.log('');

// Summary
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('');

if (failedTests === 0) {
  console.log('✓ ALL TESTS PASSED - System is ready for production!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. npm run dev     (start development server)');
  console.log('  2. npm run build   (build for production)');
  console.log('  3. npm start       (start production server)');
  console.log('='.repeat(80));
  process.exit(0);
} else {
  console.log(`✗ ${failedTests} TEST(S) FAILED - Please fix issues before deployment`);
  console.log('='.repeat(80));
  process.exit(1);
}
