const fs = require("fs")
const path = require("path")

console.log("[v0] ==========================================")
console.log("[v0] VERCEL BUILD HOOK - DATABASE SETUP")
console.log("[v0] ==========================================")

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  console.log("[v0] Creating data directory...")
  fs.mkdirSync(dataDir, { recursive: true })
  console.log("[v0] ✓ Data directory created")
}

// Check if we should use SQLite or PostgreSQL
const usePostgres =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith("postgres://") || process.env.DATABASE_URL.startsWith("postgresql://"))

if (usePostgres) {
  console.log("[v0] PostgreSQL detected from DATABASE_URL")
  console.log("[v0] Migrations will run automatically on first request")
} else {
  console.log("[v0] SQLite mode (default)")
  console.log("[v0] Database file: data/cts.db")
  console.log("[v0] Migrations will run automatically on startup")
}

// Create connections directory for file-based storage
const connectionsDir = path.join(dataDir, "connections")
if (!fs.existsSync(connectionsDir)) {
  console.log("[v0] Creating connections directory...")
  fs.mkdirSync(connectionsDir, { recursive: true })
  console.log("[v0] ✓ Connections directory created")
}

console.log("[v0] ==========================================")
console.log("[v0] BUILD HOOK COMPLETED SUCCESSFULLY")
console.log("[v0] ==========================================")
