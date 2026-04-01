#!/usr/bin/env node

/**
 * CTS v3.1 - Startup Verification Script
 * Verifies all critical components before application start
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('CTS v3.1 - Pre-Startup Verification');
console.log('='.repeat(80));
console.log('');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Critical directories
console.log('✓ Checking critical directories...');
const criticalDirs = [
  'data',
  'scripts',
  'lib',
  'app',
  'components'
];

criticalDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`  ✗ Missing: ${dir}`);
    if (dir === 'data') {
      console.log(`    Creating: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`    ✓ Created: ${dir}`);
    } else {
      hasErrors = true;
    }
  } else {
    console.log(`  ✓ ${dir}`);
  }
});

// Check 2: Critical files
console.log('');
console.log('✓ Checking critical files...');
const criticalFiles = [
  'package.json',
  'next.config.mjs',
  'tsconfig.json',
  'lib/db.ts',
  'lib/init-app.ts',
  'lib/db-migration-runner.ts',
  'scripts/unified_complete_setup.sql'
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`  ✗ Missing: ${file}`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${file}`);
  }
});

// Check 3: Environment configuration
console.log('');
console.log('✓ Checking environment configuration...');
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  console.log('  ✓ .env.local exists');
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  if (envContent.includes('DATABASE_URL=')) {
    console.log('  ✓ DATABASE_URL configured (PostgreSQL mode)');
  } else {
    console.log('  ℹ No DATABASE_URL (SQLite mode - default)');
  }
} else {
  console.log('  ℹ No .env.local file (using defaults)');
  console.log('    Database: SQLite at data/cts.db');
}

// Check 4: Node modules
console.log('');
console.log('✓ Checking dependencies...');
const nodeModules = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('  ✗ node_modules not found');
  console.log('    Run: npm install');
  hasErrors = true;
} else {
  console.log('  ✓ node_modules installed');
  
  // Check critical packages
  const criticalPackages = [
    'next',
    'react',
    'better-sqlite3',
    'postgres',
    'sonner'
  ];
  
  criticalPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModules, pkg);
    if (!fs.existsSync(pkgPath)) {
      console.log(`  ⚠ Missing package: ${pkg}`);
      hasWarnings = true;
    }
  });
}

// Check 5: Build artifacts
console.log('');
console.log('✓ Checking build artifacts...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('  ℹ .next directory exists (previous build found)');
  console.log('    Fresh build recommended for production');
} else {
  console.log('  ✓ No build artifacts (clean state)');
}

// Summary
console.log('');
console.log('='.repeat(80));
if (hasErrors) {
  console.log('✗ Verification FAILED - Critical issues found');
  console.log('  Please fix the errors above before starting the application');
  console.log('='.repeat(80));
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠ Verification PASSED with warnings');
  console.log('  The application should start, but some issues were detected');
  console.log('='.repeat(80));
  process.exit(0);
} else {
  console.log('✓ Verification PASSED - All checks successful');
  console.log('  Application is ready to start');
  console.log('='.repeat(80));
  process.exit(0);
}
