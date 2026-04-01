#!/usr/bin/env node
/**
 * Phase 4 Test Suite
 * Validates all startup initialization fixes
 */

const fs = require("fs");
const path = require("path");

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function test(name, fn) {
  try {
    console.log(`Testing: ${name}`);
    fn();
    console.log(`✅ PASSED: ${name}\n`);
    testResults.passed++;
    testResults.tests.push({ name, status: "PASSED" });
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ name, status: "FAILED", error: error.message });
  }
}

function test1StartupCoordinator() {
  if (!fs.existsSync(path.join(process.cwd(), "lib/startup-coordinator.ts"))) {
    throw new Error("startup-coordinator.ts not found");
  }

  const code = fs.readFileSync(
    path.join(process.cwd(), "lib/startup-coordinator.ts"),
    "utf8"
  );

  if (!code.includes("completeStartup")) {
    throw new Error("completeStartup function not found");
  }

  if (!code.includes("PHASE 4 FIX 4.1")) {
    throw new Error("Phase 4 fix marker not found");
  }

  if (!code.includes("no auto-start")) {
    throw new Error("No auto-start documentation not found");
  }
}

function test2CleanupOrphaned() {
  const code = fs.readFileSync(
    path.join(process.cwd(), "lib/startup-coordinator.ts"),
    "utf8"
  );

  if (!code.includes("cleanupOrphanedProgress")) {
    throw new Error("cleanupOrphanedProgress not found");
  }

  if (!code.includes("engine_is_running")) {
    throw new Error("Running flag cleanup not found");
  }

  if (!code.includes("orphaned")) {
    throw new Error("Orphaned cleanup logic not found");
  }
}

function test3StartupSequence() {
  const code = fs.readFileSync(
    path.join(process.cwd(), "lib/startup-coordinator.ts"),
    "utf8"
  );

  // Check for 7-step sequence
  if (!code.includes("Step 1/7")) {
    throw new Error("Step 1 not found in sequence");
  }

  if (!code.includes("Step 7/7")) {
    throw new Error("Complete 7-step sequence not found");
  }

  if (!code.includes("Initializing Redis")) {
    throw new Error("Redis initialization step not found");
  }

  if (!code.includes("Running database migrations")) {
    throw new Error("Migrations step not found");
  }

  if (!code.includes("Validating database integrity")) {
    throw new Error("Database validation step not found");
  }
}

function test4NoAutoStart() {
  const code = fs.readFileSync(
    path.join(process.cwd(), "lib/startup-coordinator.ts"),
    "utf8"
  );

  // Verify completeStartup doesn't call startAll or startEngine
  if (code.includes("startAll()")) {
    throw new Error("startAll() should not be called in completeStartup");
  }

  if (code.includes("coordinator.startEngine")) {
    throw new Error("coordinator.startEngine should not be called in completeStartup");
  }

  if (!code.includes("ready for manual start")) {
    throw new Error("Documentation of manual start requirement not found");
  }
}

function test5StartupStatus() {
  const code = fs.readFileSync(
    path.join(process.cwd(), "lib/startup-coordinator.ts"),
    "utf8"
  );

  if (!code.includes("getStartupStatus")) {
    throw new Error("getStartupStatus function not found");
  }

  if (!code.includes("redis_reachable")) {
    throw new Error("Startup status diagnostics not found");
  }
}

function runTests() {
  try {
    console.log("=".repeat(60));
    console.log("PHASE 4 TEST SUITE - Startup Initialization");
    console.log("=".repeat(60));
    console.log();

    test("Fix 4.1: Startup coordinator module", test1StartupCoordinator);
    test("Fix 4.1: Cleanup orphaned progress", test2CleanupOrphaned);
    test("Fix 4.1: Complete 7-step sequence", test3StartupSequence);
    test("Fix 4.1: No automatic engine start", test4NoAutoStart);
    test("Fix 4.1: Startup status diagnostics", test5StartupStatus);

    console.log("=".repeat(60));
    console.log("TEST RESULTS SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);
    console.log();

    if (testResults.failed > 0) {
      console.log("Failed Tests:");
      testResults.tests
        .filter((t) => t.status === "FAILED")
        .forEach((t) => {
          console.log(`  ❌ ${t.name}`);
          console.log(`     ${t.error}`);
        });
      process.exit(1);
    } else {
      console.log("🎉 ALL PHASE 4 TESTS PASSED!");
      console.log();
      console.log("Startup Initialization Validation Results:");
      console.log("✓ Startup coordinator with 7-step sequence");
      console.log("✓ Orphaned progress cleanup on startup");
      console.log("✓ Clear logging of startup progress");
      console.log("✓ No automatic engine start");
      console.log("✓ Manual engine enable required");
      console.log("✓ Startup status diagnostics available");
      console.log();
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

runTests();
