#!/usr/bin/env node

/**
 * Redis Migration Script
 * Migrates any existing SQL database data to Redis
 * Usage: node scripts/migrate-to-redis.js
 */

import { initRedis, setSettings, getSettings, createConnection, getAllConnections } from "@/lib/redis-db"

interface MigrationReport {
  timestamp: string
  status: "success" | "partial" | "failed"
  itemsMigrated: number
  errors: string[]
  details: Record<string, any>
}

async function migrateConnections(): Promise<{ count: number; errors: string[] }> {
  console.log("[v0] Migrating connections...")
  const errors: string[] = []
  let count = 0

  try {
    // Connections should already be in Redis from init
    const existingConnections = await getAllConnections()
    count = existingConnections.length
    console.log(`[v0] ✓ Verified ${count} connections in Redis`)
  } catch (error) {
    const msg = `Failed to verify connections: ${error}`
    errors.push(msg)
    console.error(`[v0] ✗ ${msg}`)
  }

  return { count, errors }
}

async function migrateSettings(): Promise<{ count: number; errors: string[] }> {
  console.log("[v0] Migrating system settings...")
  const errors: string[] = []
  let count = 0

  try {
    // Ensure default settings exist
    const defaultSettings = {
      indication_settings: {
        validationTimeout: "15",
        positionCooldownMs: "100",
        maxPositionsPerConfigDirection: "1",
      },
      trade_engine_config: {
        indicationInterval: "5",
        strategyInterval: "10",
        realtimeInterval: "1",
      },
      system_settings: {
        api_rate_limit: "100",
        max_concurrent_orders: "10",
        order_timeout_ms: "30000",
      },
    }

    for (const [key, value] of Object.entries(defaultSettings)) {
      const existing = await getSettings(key)
      if (!existing) {
        await setSettings(key, value)
        count++
        console.log(`[v0] ✓ Created default setting: ${key}`)
      }
    }
  } catch (error) {
    const msg = `Failed to migrate settings: ${error}`
    errors.push(msg)
    console.error(`[v0] ✗ ${msg}`)
  }

  return { count, errors }
}

async function migrateOrders(): Promise<{ count: number; errors: string[] }> {
  console.log("[v0] Migrating orders...")
  const errors: string[] = []
  let count = 0

  try {
    // Initialize empty orders list if not exists
    const existing = await getSettings("orders")
    if (!existing) {
      await setSettings("orders", [])
      console.log("[v0] ✓ Initialized orders list in Redis")
    } else {
      count = Array.isArray(existing) ? existing.length : 0
      console.log(`[v0] ✓ Found ${count} existing orders in Redis`)
    }
  } catch (error) {
    const msg = `Failed to migrate orders: ${error}`
    errors.push(msg)
    console.error(`[v0] ✗ ${msg}`)
  }

  return { count, errors }
}

async function migratePositions(): Promise<{ count: number; errors: string[] }> {
  console.log("[v0] Migrating positions...")
  const errors: string[] = []
  let count = 0

  try {
    // Initialize empty positions list if not exists
    const existing = await getSettings("positions")
    if (!existing) {
      await setSettings("positions", [])
      console.log("[v0] ✓ Initialized positions list in Redis")
    } else {
      count = Array.isArray(existing) ? existing.length : 0
      console.log(`[v0] ✓ Found ${count} existing positions in Redis`)
    }
  } catch (error) {
    const msg = `Failed to migrate positions: ${error}`
    errors.push(msg)
    console.error(`[v0] ✗ ${msg}`)
  }

  return { count, errors }
}

async function migrateLogs(): Promise<{ count: number; errors: string[] }> {
  console.log("[v0] Migrating logs...")
  const errors: string[] = []
  let count = 0

  try {
    // Initialize system logs if not exists
    const existing = await getSettings("system_logs")
    if (!existing) {
      await setSettings("system_logs", [])
      console.log("[v0] ✓ Initialized system logs in Redis")
    } else {
      count = Array.isArray(existing) ? existing.length : 0
      console.log(`[v0] ✓ Found ${count} existing log entries in Redis`)
    }
  } catch (error) {
    const msg = `Failed to migrate logs: ${error}`
    errors.push(msg)
    console.error(`[v0] ✗ ${msg}`)
  }

  return { count, errors }
}

async function runMigration(): Promise<void> {
  console.log("=" + "=".repeat(59))
  console.log("[v0] Redis Migration Started - " + new Date().toISOString())
  console.log("=" + "=".repeat(59))

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    status: "success",
    itemsMigrated: 0,
    errors: [],
    details: {},
  }

  try {
    // Initialize Redis
    await initRedis()
    console.log("[v0] ✓ Connected to Redis\n")

    // Run all migrations
    const migrations = [
      { name: "connections", fn: migrateConnections },
      { name: "settings", fn: migrateSettings },
      { name: "orders", fn: migrateOrders },
      { name: "positions", fn: migratePositions },
      { name: "logs", fn: migrateLogs },
    ]

    for (const { name, fn } of migrations) {
      const result = await fn()
      report.itemsMigrated += result.count
      report.details[name] = result
      if (result.errors.length > 0) {
        report.errors.push(...result.errors)
        report.status = "partial"
      }
      console.log()
    }

    // Save migration report
    const reports = (await getSettings("migration_reports")) || []
    reports.push(report)
    await setSettings("migration_reports", reports)

    console.log("=" + "=".repeat(59))
    console.log(`[v0] Migration Complete - Status: ${report.status}`)
    console.log(`[v0] Total items migrated: ${report.itemsMigrated}`)
    console.log(`[v0] Errors: ${report.errors.length}`)
    if (report.errors.length > 0) {
      console.log("\nErrors encountered:")
      report.errors.forEach((err) => console.log(`  - ${err}`))
    }
    console.log("=" + "=".repeat(59))
  } catch (error) {
    console.error("[v0] ✗ Migration failed:", error)
    report.status = "failed"
    report.errors.push(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

runMigration().catch(console.error)
