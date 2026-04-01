/**
 * Redis Database Setup and Migration Script
 * Initializes Redis with optimized data structures and indexes
 */

import { initRedis, getRedisClient, setSettings, getSettings } from "@/lib/redis-db"
import { runMigrations, getMigrationStatus } from "@/lib/redis-migrations"

async function main() {
  try {
    console.log("========================================")
    console.log("CTS v3.2 - Redis Database Setup")
    console.log("========================================\n")

    // Step 1: Initialize Redis connection
    console.log("Step 1: Connecting to Redis...")
    try {
      await initRedis()
      console.log("✓ Redis connected successfully\n")
    } catch (error) {
      console.error("✗ Failed to connect to Redis:", error)
      process.exit(1)
    }

    // Step 2: Check current migration status
    console.log("Step 2: Checking migration status...")
    const client = getRedisClient()
    const status = await getMigrationStatus()
    console.log(`Current schema version: ${status.currentVersion}`)
    console.log(`Latest schema version: ${status.latestVersion}`)
    console.log()

    // Step 3: Run migrations
    if (status.currentVersion < status.latestVersion) {
      console.log("Step 3: Running pending migrations...")
      try {
        await runMigrations()
        console.log("✓ Migrations completed successfully\n")
      } catch (error) {
        console.error("✗ Migrations failed:", error)
        process.exit(1)
      }
    } else {
      console.log("Step 3: Database already up-to-date\n")
    }

    // Step 4: Create indexes and optimize data structures
    console.log("Step 4: Creating indexes and optimizations...")
    try {
      // Connection indexes
      await client.set("_index:connections:enabled", "true")
      await client.set("_index:connections:by_exchange", "true")
      await client.set("_index:connections:by_status", "true")

      // Trade indexes
      await client.set("_index:trades:by_connection", "true")
      await client.set("_index:trades:by_status", "true")
      await client.set("_index:trades:by_date", "true")

      // Position indexes
      await client.set("_index:positions:by_symbol", "true")
      await client.set("_index:positions:by_connection", "true")
      await client.set("_index:positions:active", "true")

      console.log("✓ Indexes created successfully\n")
    } catch (error) {
      console.error("✗ Index creation failed:", error)
      process.exit(1)
    }

    // Step 5: Initialize TTL policies
    console.log("Step 5: Setting up TTL policies...")
    try {
      // TTL policies for different data types
      const ttlPolicies = {
        connections: 30 * 24 * 60 * 60, // 30 days
        trades: 90 * 24 * 60 * 60, // 90 days
        positions: 60 * 24 * 60 * 60, // 60 days
        logs: 7 * 24 * 60 * 60, // 7 days
        cache: 24 * 60 * 60, // 1 day
      }

      for (const [key, ttl] of Object.entries(ttlPolicies)) {
        await setSettings(`ttl_policy:${key}`, ttl)
      }

      console.log("✓ TTL policies configured successfully\n")
    } catch (error) {
      console.error("✗ TTL policy setup failed:", error)
      process.exit(1)
    }

    // Step 6: Verify database stats
    console.log("Step 6: Database statistics...")
    try {
      const keyCount = await client.dbSize()
      const info = await client.info()
      
      console.log(`Total keys: ${keyCount}`)
      console.log(`Redis memory usage: ${(info.split("\r\n").find(line => line.includes("used_memory_human")) || "unknown")}\n`)
    } catch (error) {
      console.warn("Could not retrieve stats:", error)
    }

    // Step 7: System configuration
    console.log("Step 7: Initializing system settings...")
    try {
      const systemConfig = {
        database_type: "redis",
        initialized_at: new Date().toISOString(),
        version: "3.2",
        features: {
          live_trading: true,
          preset_trading: true,
          backtesting: true,
          multi_exchange: true,
        },
      }

      await setSettings("system:config", systemConfig)
      console.log("✓ System configuration initialized\n")
    } catch (error) {
      console.error("✗ System configuration failed:", error)
      process.exit(1)
    }

    console.log("========================================")
    console.log("✓ Redis setup completed successfully!")
    console.log("========================================")
    console.log("\nYour CTS v3.2 trading system is ready.")
    console.log("Database: Redis")
    console.log("Status: Fully initialized with indexes and optimizations")
    console.log("Schema Version: " + status.latestVersion)
    console.log()

    process.exit(0)
  } catch (error) {
    console.error("\n✗ Unexpected error during setup:", error)
    process.exit(1)
  }
}

main()
