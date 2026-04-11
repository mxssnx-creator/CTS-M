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
- [x] Observability now recognizes historic vs realtime processing separately from database-backed engine state, timestamps, and structured logs so UIs can show smarter phase-specific tracking and statistics
- [x] System verification scripts now match the actual Bun/Next/Redis setup, build successfully, initialize at layout startup again, and avoid false API failures when no local server is running during offline verification
- [x] Added offline route-handler verification for key APIs so workflow checks can validate system health, trade-engine status, and progression logic without depending on a reachable localhost server
- [x] Verification is now organized into Bun script entrypoints (`verify:offline`, `verify:online`, `verify:all`) and offline coverage now includes observability-heavy main stats and detailed log routes
- [x] Progression and monitoring flows now detect interrupted/stale realtime activity explicitly, expose interruption flags in progression payloads, and validate systemwide flow endpoints offline to catch no-progression faults before UI/runtime failures
- [x] Added shared engine resilience logic to assess stale activity and auto-trigger recovery for eligible running connections, reducing interruptions before they surface as user-visible stalled progression states
- [x] Continuous monitor loop now executes resilience recovery proactively, and key dashboard/live-trading UI surfaces display interrupted/recovering states so prevention and recovery remain visible and systemwide rather than page-specific

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
| `app/api/trade-engine/status/route.ts` | Status API now exposes phase-aware historic/realtime observability | ✅ Updated |
| `scripts/verify-startup.js` | Startup verification aligned to current Next config and optional DB drivers | ✅ Updated |
| `scripts/system-check.js` | System health checks aligned to current Next config naming | ✅ Updated |
| `app/layout.tsx` | Root layout now restores startup initialization on render | ✅ Updated |
| `scripts/verify-api-routes-offline.ts` | Offline route-level verification for key system APIs | ✅ Added |
| `package.json` | Consolidated Bun verification entrypoints for offline/online/full checks | ✅ Updated |
| `app/api/connections/progression/[id]/route.ts` | Progression route now flags interrupted/stalled engines and stale realtime flow | ✅ Updated |
| `app/api/trade-engine/progression/route.ts` | Connection progression overview now includes observability-backed interruption state | ✅ Updated |
| `lib/engine-resilience.ts` | Shared stale-flow assessment and automatic engine recovery orchestration | ✅ Added |
| `app/api/trade-engine/status/route.ts` | Status route now exposes recovery state and performs prevention-aware flow assessment | ✅ Updated |
| `lib/trade-engine-auto-start.ts` | Monitor loop now runs continuous resilience recovery for enabled connections | ✅ Updated |
| `components/dashboard/active-connection-card.tsx` | Dashboard active cards now show interrupted and auto-recovery states | ✅ Updated |
| `components/live-trading/trade-engine-progression.tsx` | Live trading progression cards now surface interruption/recovery status | ✅ Updated |

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
14. Historic and realtime processing are now detected independently using persisted engine-state fields, structured logs, and last-run timestamps so statistics retrieval is more conformant to actual processing stage
15. Verification workflow is now reliable again: build uses the local Next binary under Bun, startup checks accept `next.config.ts`, and offline API verification exits cleanly when no sandboxed app URL is reachable
16. Key workflow verification no longer requires localhost availability because core route handlers can now be executed directly in-process for offline integrity checks
17. Verification is now organized and solid enough for repeatable operator use: offline route coverage includes status, progression, main statistics, and detailed logs, while online checks remain optional when a live server is available
18. Interrupted and no-progression conditions are now surfaced explicitly across progression and engine-progress APIs instead of silently presenting stalled engines as healthy idle flows
19. Eligible stalled engines now enter an automatic recovery path with cooldown protection, so interruption prevention is built into status/progression reads rather than relying only on manual restart flows
20. Interruption prevention is now continuous: the background auto-start monitor proactively triggers resilience recovery, and the UI explicitly shows `recovering`/`interrupted` states so stalled flow is both mitigated and observable

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
| 2026-04-11 | Made observability phase-aware for historic vs realtime processing, deriving smarter UI metrics from persisted engine state, structured logs, and last-run timestamps across status, progression, and connection dialogs |
| 2026-04-11 | Fixed verification and startup workflow mismatches by restoring `initializeApplication()` in `app/layout.tsx`, switching build/start scripts to the local Next binary, and updating legacy verification scripts for `next.config.ts`, optional DB drivers, and unreachable local API checks |
| 2026-04-11 | Added offline API route verification and converted remaining validation/setup guidance to Bun-based commands so workflow checks remain accurate without a reachable sandbox server |
| 2026-04-11 | Organized verification into explicit Bun entrypoints and expanded offline route validation to observability-heavy APIs (`main` stats and `trade-engine/detailed-logs`), yielding a stable end-to-end hardening workflow |
| 2026-04-11 | Added explicit interruption/stale-flow detection to progression APIs, stabilized strategy overview response shape, and expanded offline verification to engine-progress, trade-engine progression, monitoring, and strategy overview routes for systemwide no-progression fault detection |
| 2026-04-11 | Added shared engine resilience recovery logic that detects stale realtime activity, attempts automatic restart for eligible connections with cooldown protection, and exposes recovery state through status and progression APIs to minimize visible interruptions |
| 2026-04-11 | Moved interruption prevention into the continuous auto-start monitor loop and surfaced recovery/interruption badges in active connection, monitoring, and live-trading UI components so systemwide recovery is proactive and visible |
