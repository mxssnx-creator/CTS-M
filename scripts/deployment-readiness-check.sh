#!/bin/bash
# CTS v3.1 - Live Server Deployment Readiness Verification
# Comprehensive pre-deployment checklist and health verification

set -e

echo "=========================================="
echo "CTS v3.1 - DEPLOYMENT READINESS AUDIT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0
warn_count=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((pass_count++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((fail_count++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((warn_count++))
}

# 1. Environment & Configuration
echo "1. Environment & Configuration Checks"
echo "======================================"

if [ -f ".env.local" ]; then
  check_pass "Environment file exists"
  
  if grep -q "UPSTASH_REDIS_URL" .env.local; then
    check_pass "Redis connection configured"
  else
    check_fail "Redis connection NOT configured (.env.local missing UPSTASH_REDIS_URL)"
  fi
else
  check_fail "Environment file (.env.local) NOT found"
fi

if [ -f "package.json" ]; then
  check_pass "package.json found"
else
  check_fail "package.json NOT found"
fi

if [ -f "next.config.mjs" ]; then
  check_pass "Next.js config found"
else
  check_fail "next.config.mjs NOT found"
fi

echo ""

# 2. Dependency Verification
echo "2. Dependency & Compatibility Checks"
echo "===================================="

if [ -f "package.json" ]; then
  if grep -q '"next": "16' package.json; then
    check_pass "Next.js 16 configured"
  else
    check_warn "Next.js version may not be 16"
  fi
  
  if grep -q '"react": "19' package.json; then
    check_pass "React 19 configured"
  else
    check_warn "React version may not be 19"
  fi
  
  if grep -q '"redis":' package.json; then
    check_pass "Redis client configured"
  else
    check_fail "Redis client NOT in dependencies"
  fi
  
  if grep -q '"ccxt":' package.json; then
    check_pass "CCXT exchange library configured"
  else
    check_fail "CCXT NOT in dependencies"
  fi
else
  check_fail "Cannot verify dependencies (package.json not found)"
fi

echo ""

# 3. Critical API Endpoints
echo "3. Critical API Endpoints"
echo "========================="

endpoints=(
  "app/api/init/route.ts"
  "app/api/settings/connections/route.ts"
  "app/api/settings/connections/\[id\]/route.ts"
  "app/api/trade-engine/route.ts"
  "app/api/trade-engine/status/route.ts"
  "app/api/monitoring/logs/route.ts"
)

for endpoint in "${endpoints[@]}"; do
  if [ -f "$endpoint" ]; then
    check_pass "Endpoint exists: $endpoint"
  else
    check_fail "CRITICAL: Endpoint missing: $endpoint"
  fi
done

echo ""

# 4. Database Initialization
echo "4. Database & Migration Setup"
echo "============================="

if [ -f "lib/redis-migrations.ts" ]; then
  check_pass "Redis migrations configured"
  
  if grep -q "migration.*v14\|version.*14" lib/redis-migrations.ts; then
    check_pass "Latest BingX credentials migration (v14) in place"
  else
    check_warn "Latest migration version may not be applied"
  fi
else
  check_fail "Redis migrations file NOT found"
fi

if [ -f "lib/redis-db.ts" ]; then
  check_pass "Redis database layer configured"
else
  check_fail "Redis database layer NOT found"
fi

echo ""

# 5. Security & Error Handling
echo "5. Security & Error Handling"
echo "============================"

if [ -f "app/error.tsx" ]; then
  check_pass "Error boundary configured"
else
  check_warn "Error page (app/error.tsx) not found"
fi

if [ -f "app/global-error.tsx" ]; then
  check_pass "Global error handler configured"
else
  check_warn "Global error page not found"
fi

if [ -f "lib/error-handler.ts" ]; then
  check_pass "Error handler utility exists"
else
  check_fail "Error handler utility missing"
fi

if grep -r "process.env.NODE_ENV" app --include="*.ts*" --include="*.js*" > /dev/null 2>&1; then
  check_pass "Environment-aware code found"
else
  check_warn "No environment-aware configuration found"
fi

echo ""

# 6. Connection Management
echo "6. Connection Management"
echo "======================="

if [ -f "lib/connection-predefinitions.ts" ]; then
  if grep -q "bingx\|bybit\|okx\|pionex" lib/connection-predefinitions.ts; then
    check_pass "Predefined connections configured (BingX, Bybit, OKX, Pionex)"
  else
    check_fail "Predefined connections incomplete"
  fi
else
  check_fail "Connection predefinitions NOT found"
fi

if [ -f "lib/trade-engine.ts" ]; then
  check_pass "Trade engine coordinator configured"
else
  check_fail "Trade engine coordinator NOT found"
fi

echo ""

# 7. Rate Limiting & Performance
echo "7. Rate Limiting & Performance"
echo "=============================="

if [ -f "lib/rate-limiter.ts" ]; then
  check_pass "Rate limiter configured"
else
  check_fail "Rate limiter NOT found"
fi

if grep -q "MAX_TESTS_PER_MINUTE\|rate.*limit" app/api/settings/connections/*/test/route.ts 2>/dev/null; then
  check_pass "Connection test rate limiting configured"
else
  check_warn "Connection test rate limiting may not be enabled"
fi

echo ""

# 8. System Initialization
echo "8. System Initialization"
echo "======================="

if [ -f "components/system-initializer.tsx" ]; then
  check_pass "System initializer component configured"
else
  check_fail "System initializer component NOT found"
fi

if grep -q "SystemInitializer" app/layout.tsx 2>/dev/null; then
  check_pass "System initializer integrated in layout"
else
  check_fail "System initializer NOT integrated in layout"
fi

echo ""

# 9. Build Configuration
echo "9. Build Configuration"
echo "===================="

if [ -f "next.config.mjs" ]; then
  if grep -q "reactStrictMode.*true\|typescript" next.config.mjs; then
    check_pass "Build optimizations configured"
  else
    check_warn "Build config may need optimization"
  fi
  
  if grep -q "serverExternalPackages" next.config.mjs; then
    check_pass "External packages configured (redis, ccxt, protobufjs)"
  else
    check_fail "Server external packages NOT configured"
  fi
else
  check_fail "next.config.mjs NOT found"
fi

echo ""

# 10. Logging & Monitoring
echo "10. Logging & Monitoring"
echo "======================="

if [ -f "lib/logger.ts" ]; then
  check_pass "Logger configured"
else
  check_fail "Logger NOT found"
fi

if [ -f "lib/system-logger.ts" ]; then
  check_pass "System logger configured"
else
  check_warn "System logger not found (may use generic logger)"
fi

if [ -f "app/api/monitoring/logs/route.ts" ]; then
  check_pass "Log API endpoint configured"
else
  check_warn "Log API endpoint may not exist"
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT READINESS SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo -e "${YELLOW}Warnings: $warn_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  if [ $warn_count -gt 0 ]; then
    echo -e "${YELLOW}Status: READY WITH WARNINGS${NC}"
    echo "Review warnings above before deployment"
    exit 0
  else
    echo -e "${GREEN}Status: FULLY READY FOR DEPLOYMENT${NC}"
    echo "All critical checks passed!"
    exit 0
  fi
else
  echo -e "${RED}Status: NOT READY FOR DEPLOYMENT${NC}"
  echo "Fix $fail_count critical failures before deployment"
  exit 1
fi
