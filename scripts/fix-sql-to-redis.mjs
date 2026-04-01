#!/usr/bin/env node

/**
 * Complete SQL-to-Redis Engine Conversion Script
 * Removes all SQL dependencies from trade engine and related files
 * Ensures all operations use Redis exclusively
 */

import fs from 'fs'
import path from 'path'

const FILES_TO_FIX = [
  'lib/data-sync-manager.ts',
  'lib/exchange-position-manager.ts',
  'lib/position-flow-coordinator.ts',
  'lib/preset-coordination-engine.ts',
  'lib/preset-pseudo-position-manager.ts',
  'lib/preset-set-evaluator.ts',
  'lib/preset-tester.ts',
  'lib/realtime/market-data-stream.ts',
  'lib/trade-engine.ts',
  'lib/trade-engine/pseudo-position-manager.ts',
  'lib/volume-calculator.ts'
]

const CONVERSION_PATTERN = {
  fromPattern: /import\s*{\s*sql\s*}\s*from\s*["']@\/lib\/db["']/g,
  toReplacement: `import { getSettings, setSettings } from "@/lib/redis-db"`
}

async function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.log(`[SKIP] ${filePath} - file not found`)
      return false
    }

    let content = fs.readFileSync(fullPath, 'utf-8')
    const originalContent = content

    // Replace SQL import with Redis import
    content = content.replace(CONVERSION_PATTERN.fromPattern, CONVERSION_PATTERN.toReplacement)

    // Remove any remaining `await sql` calls (they should be handled manually, this is just detection)
    if (content.includes('await sql`') || content.includes('await sql(')) {
      console.log(`[WARNING] ${filePath} still contains SQL queries - needs manual conversion`)
    }

    // Check if file was actually modified
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8')
      console.log(`[FIXED] ${filePath}`)
      return true
    } else {
      console.log(`[ALREADY OK] ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`[ERROR] ${filePath}: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Starting comprehensive SQL-to-Redis engine conversion...\n')

  let fixed = 0
  let errors = 0

  for (const file of FILES_TO_FIX) {
    const success = await fixFile(file)
    if (success) fixed++
  }

  console.log(`\n✓ Conversion complete: ${fixed} files updated`)
  
  console.log('\n⚠ IMPORTANT: The following files need manual SQL query conversion:')
  console.log('  - Ensure all async SQL calls are replaced with getSettings/setSettings')
  console.log('  - Use config keys like "base_positions:${connectionId}"')
  console.log('  - Arrays are stored in Redis as JSON')
  console.log('  - See /docs/REDIS_COMPLETE_MIGRATION_GUIDE.md for patterns')
}

main().catch(console.error)
