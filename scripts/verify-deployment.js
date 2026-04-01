#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Validates that all critical files and configurations are correct before deployment
 */

const fs = require("fs")
const path = require("path")

const rootDir = process.cwd()

console.log("CTS v3.1 Deployment Verification\n")

let hasErrors = false

// Critical files that must exist
const criticalFiles = [
  "package.json",
  "tsconfig.json",
  "next.config.mjs",
  "vercel.json",
  "lib/trade-engine.ts",
  "lib/trade-engine/index.ts",
  "lib/trade-engine/trade-engine.tsx",
  "lib/db.ts",
  "lib/types.ts",
  "hooks/use-toast.ts",
  "app/page.tsx",
  "app/layout.tsx",
]

console.log("✓ Checking critical files...")
for (const file of criticalFiles) {
  const filePath = path.join(rootDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ MISSING: ${file}`)
    hasErrors = true
  } else {
    console.log(`  ✓ ${file}`)
  }
}

// Files that should NOT exist
const forbiddenFiles = ["lib/configuration-set-manager.ts", "lib/configuration-set-manager.tsx"]

console.log("\n✓ Checking for stray files...")
let foundStray = false
for (const file of forbiddenFiles) {
  const filePath = path.join(rootDir, file)
  if (fs.existsSync(filePath)) {
    console.error(`  ✗ FOUND STRAY FILE: ${file} (should not exist)`)
    hasErrors = true
    foundStray = true
  }
}
if (!foundStray) {
  console.log("  ✓ No stray files found")
}

// Verify tsconfig.json settings
console.log("\n✓ Verifying TypeScript configuration...")
const tsconfigPath = path.join(rootDir, "tsconfig.json")
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"))

if (tsconfig.compilerOptions.incremental !== false) {
  console.error("  ✗ tsconfig.json: incremental should be false")
  hasErrors = true
} else {
  console.log("  ✓ Incremental builds disabled")
}

if (!tsconfig.exclude || !tsconfig.exclude.includes("backups/**/*")) {
  console.error("  ✗ tsconfig.json: backups folder should be excluded")
  hasErrors = true
} else {
  console.log("  ✓ Backup files excluded from compilation")
}

// Verify package.json scripts
console.log("\n✓ Verifying package.json scripts...")
const packagePath = path.join(rootDir, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"))

if (!packageJson.scripts["vercel-build"]) {
  console.error("  ✗ Missing vercel-build script")
  hasErrors = true
} else if (!packageJson.scripts["vercel-build"].includes("prebuild")) {
  console.error("  ✗ vercel-build should run prebuild")
  hasErrors = true
} else {
  console.log("  ✓ vercel-build script configured correctly")
}

if (!packageJson.scripts.preinstall) {
  console.error("  ✗ Missing preinstall cache clearing script")
  hasErrors = true
} else {
  console.log("  ✓ preinstall cache clearing enabled")
}

// Check for environment variable examples
console.log("\n✓ Verifying environment setup...")
const envExamplePath = path.join(rootDir, ".env.example")
if (fs.existsSync(envExamplePath)) {
  console.log("  ✓ .env.example found")
} else {
  console.log("  ⚠ .env.example not found (optional)")
}

// Final summary
console.log("\n" + "=".repeat(60))
if (hasErrors) {
  console.error("\n✗ VERIFICATION FAILED")
  console.error("Please fix the errors above before deploying.\n")
  process.exit(1)
} else {
  console.log("\n✅ VERIFICATION PASSED")
  console.log("All checks passed! Ready for deployment.\n")
  process.exit(0)
}
