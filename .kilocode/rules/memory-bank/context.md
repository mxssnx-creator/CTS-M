# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Extended with production-facing trading dashboard fixes and strategy engine improvements

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Connection card now includes detailed log dialog and compact log overview
- [x] Progression/log overview APIs now reconcile counts from progression state, engine state, and Redis keyspace so dialogs no longer show zeros while data exists
- [x] Dev comprehensive test scripts no longer try to launch forbidden `dev` processes and now rely on the sandbox runtime safely
- [x] Strategy engine profit factor thresholds updated: base eval to 1.2, main to 1.4
- [x] Pseudo position limit per direction of 1 enforced for each validated indication per strategy config combination
- [x] Strategy counts now focus on Sets rather than pseudo positions
- [x] Sets configured with max 250 entries and threshold rearrangement at 80%
- [x] Main Strategy Sets now select from base ones where profitfactor > 1.4
- [x] Real Strategy Sets now select from Main Sets where profitfactor > threshold
- [x] Strategy coordinator now enforces per-config-per-direction base set intake of 1 and derives counts from evaluated sets instead of pseudo-position volume
- [x] Live trading selection now ranks real strategies and caps executable positions at 500 best candidates
- [x] Per-set pseudo position limiting is now keyed independently by symbol + config combination + direction to avoid cross-set blocking
- [x] Comprehensive dev test run completed; current failures are in legacy Redis verification methods and several timeout-prone API endpoints, not in typecheck/lint
- [x] Added Redis operation compatibility shims and Redis set-based fallback loading for indications/strategies APIs to reduce timeout and empty-response failures
- [x] Verify-engine and quick-start endpoints now use cleaner active-connection detection and quick-start status handling, but legacy runtime still shows cached verifier method gaps during dev server hot state
- [x] Tracking-heavy endpoints now share a unified dashboard snapshot helper so progression, engine progress, monitoring stats, and strategy/indication overview routes stop reporting false zeros or mock-only counts
- [x] Quick Start now drives BingX selection in the top exchange selector and quickstart dialogs/log overviews follow the actively selected connection instead of a hardcoded default
- [x] Trade engine status, connection info dialogs, and related monitoring views now derive connection-scoped live metrics from shared insights instead of disconnected per-view placeholders
- [x] Added a shared connection observability layer so engine tracking, prehistoric progress, logs, indications, and strategy counts resolve from one relation and stay consistent across main status APIs and info dialogs
- [x] Connection progression endpoints and dashboard progression/log dialogs now consume the shared observability relation, exposing consistent log counts, symbol coverage, prehistoric state, and indication/strategy totals inside active-connection cards

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |
| `components/settings/connection-card.tsx` | Connection UI + logs | ✅ Updated |
| `lib/strategies.ts` | Strategy engine with updated profit factor thresholds | ✅ Updated |
| `lib/strategy-coordinator.ts` | Strategy flow coordination with new thresholds | ✅ Updated |
| `lib/strategy-sets-processor.ts` | Strategy sets with max 250 entries and threshold rearrangement | ✅ Updated |
| `lib/indication-sets-processor.ts` | Indication sets with position limit per direction | ✅ Updated |
| `lib/strategy-evaluator.ts` | Set-based stage counting via unique evaluated set keys | ✅ Updated |
| `lib/redis-operations.ts` | Compatibility shims for legacy verification paths | ✅ Updated |
| `lib/db-helpers.ts` | Fallback loading from set-based indication/strategy Redis stores | ✅ Updated |
| `lib/dashboard-tracking.ts` | Unified live tracking/count aggregation for monitoring and overview APIs | ✅ Added |
| `lib/exchange-context.tsx` | Shared exchange selection with BingX quickstart preference | ✅ Updated |
| `lib/connection-insights.ts` | Shared connection-scoped engine/log/tracking metrics for status and dialogs | ✅ Added |
| `lib/connection-observability.ts` | Unified relation model for engine tracking, logs, prehistoric info, indications, and strategies | ✅ Added |
| `app/api/connections/progression/[id]/route.ts` | Progression API enriched with observability-backed metrics for dashboard cards | ✅ Updated |

## Current Focus

The template is ready. Trading dashboard and connection log presentation were improved for progression visibility:

1. Additional production engine fixes and endpoint hardening
2. Broader statistics/DB verification on real data paths
3. Further log categorization and operational dashboards
4. Unified metrics derivation across monitoring, quickstart dialogs, and connection log summaries
5. Strategy engine improvements with stricter profit factor requirements
6. Prioritized live set selection with 500-position cap for real trading
7. Investigating legacy verification/API timeout failures surfaced by comprehensive dev testing
8. Remaining runtime issues are now concentrated in dev-server stale module state and engine/coordinator startup visibility
9. Endpoint metrics now prioritize real progression/Redis snapshots over placeholder mock aggregates
10. Quickstart UX now keeps connection-scoped dialogs and top-level exchange selection aligned to the current BingX/active connection
11. Monitoring/status cards and connection info views now consume a shared real-data connection insight layer to keep UI state and backend tracking aligned after quickstart activation
12. Main-page and dialog consumers now share one observability relation to prevent engine/log/info drift between status cards, detailed logging, and connection information panels
13. Active connection cards and progression dialogs now expose the same observability-backed counts and prehistoric coverage used by the status/logging APIs

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-04-09 | Added detailed connection log dialog and compact log summary for engine progression visibility |
| 2026-04-10 | Fixed systemwide count reconciliation for progression/log dialogs and updated dev test scripts to avoid spawning local dev servers |
| 2026-04-10 | Strategy engine updates: profit factor thresholds (base 1.2, main 1.4), position limits per direction, Sets-based counting, max 250 entries with threshold rearrangement |
| 2026-04-10 | Refined strategy set flow: base intake limited per config+direction, main/real chained by set survivors, set counts based on evaluated sets, live trading capped to top 500 |
| 2026-04-10 | Confirmed per-set pseudo position independence via symbol+config+direction identity and ran comprehensive dev test suite; failures point to unrelated Redis verification method gaps and API timeouts |
| 2026-04-10 | Added Redis compatibility helpers, set-based API fallbacks, and verify/quick-start endpoint improvements; rerun reduced failures from 5 to 3, with remaining issues tied to stale dev runtime and coordinator visibility |
| 2026-04-10 | Reworked tracking-centric endpoints to consume unified live aggregation, removing hardcoded strategy overview data and reducing zero-count drift across progression, monitoring, and evaluation APIs |
| 2026-04-10 | Updated exchange context and quickstart dialogs so BingX is auto-selected for quickstart and detailed/overview log data stays scoped to the selected connection |
| 2026-04-10 | Added shared connection insights for status/dialog UIs, updated trade engine status responses to include real per-connection health/metrics, and verified BingX startup flow plus lint/typecheck |
| 2026-04-11 | Added shared connection observability composition, updated trade-engine status/detail routes to expose consistent per-connection tracking/log/info data, and expanded the connection info dialog with unified engine relation metrics |
| 2026-04-11 | Extended shared observability into progression APIs and active-connection dialogs so dashboard cards, progression logs, and info panels all report the same connection-scoped engine/log/prehistoric/indication/strategy data |
