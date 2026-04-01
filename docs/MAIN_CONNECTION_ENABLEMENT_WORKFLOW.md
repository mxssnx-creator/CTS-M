# Main Connection Enablement Workflow (Operational + Logistics)

This document explains exactly what happens after a connection is enabled in **Main Connections (Active Connections)** and how the coordinated logistics pipeline behaves.

## 1) Preconditions (before enable)

A connection should be considered ready when all of the following are true:

1. API credentials are present and valid (`api_key`, `api_secret`).
2. The connection is assigned to the active panel (`is_active_inserted=1` / dashboard inserted).
3. The dashboard/main toggle is enabled (`is_enabled_dashboard=1`) for dashboard-driven flows.
4. For auto-start/system-level engine activation paths, internal enablement is active (`is_enabled=1`).
5. Global trade engine coordinator is running (`trade_engine:global.status=running`).

## 2) Trigger action (UI/API)

When you toggle a Main connection ON from dashboard/settings endpoints, the system updates connection flags in Redis and then reconciles engine lifecycle state.

Common trigger endpoints:

- `PUT /api/settings/connections/{id}/toggle-dashboard`
- `POST /api/trade-engine/quick-start`
- `POST /api/trade-engine/start-all` (global orchestrator path)

## 3) Immediate orchestration sequence

After enablement, orchestration follows this high-level sequence:

1. **Connection state is persisted** (Redis hash update).
2. **Workflow snapshot becomes eligible** if credentials + active panel + enable flags are satisfied.
3. **Coordinator checks runtime state** (global engine status + per-connection engine status).
4. **Engine start is attempted** for newly eligible/stopped connection engines.
5. **Progression/logistics APIs refresh** from unified snapshot + progression data.

## 4) Processing phases after enable

Once engine starts, the connection typically enters these coordinated phases:

1. **Prehistoric/Historical Load Phase**
   - Symbol/timeframe bootstrap and historical cache validation.
2. **Indication Phase**
   - Technical indication generation and set persistence.
3. **Strategy Phase**
   - Strategy evaluation over indication outputs.
4. **Realtime Phase**
   - Live market updates and cycle-based decision loop.
5. **(Optional) Live Trade Phase**
   - Real exchange actions only when `is_live_trade=1`.

## 5) Logistics coordination model

The logistics model is coordinated via the shared workflow snapshot:

- **Eligibility accounting**: counts eligible connections for engine processing.
- **Queue approximation**: derived queue pressure (`eligible - liveTradeEnabled`) exposed in logistics API.
- **Latency/throughput**: inferred from engine cycle counts and average durations.
- **Operational focus connection**: prioritized connection for detailed progression metrics/logs.

Primary logistics/status surfaces:

- `GET /api/logistics/queue`
- `GET /api/main/system-stats-v3`
- `GET /api/tracking/overview`
- `GET /api/connections/progression/{id}`

## 6) Monitoring and integrity checkpoints

Use this checklist after enabling a main connection:

1. `trade_engine:global` hash reports `status=running`.
2. Connection hash shows expected active/enable flags.
3. Progression endpoint transitions to active/running evidence.
4. Logistics queue returns non-empty workflow phases.
5. Tracking overview reports live progression/log slices for the connection.
6. No duplicate monitor loops (auto-start monitor remains single-instance and non-overlapping).

## 7) Failure handling behavior

If startup/read paths fail transiently:

- Auto-start monitor remains/restarts and continues periodic reconciliation.
- Monitoring loops are guarded against duplicate timer creation.
- Monitoring cycles are non-overlapping to avoid false concurrent loop storms.
- Redis key scans and TTL cleanup remain consistent to avoid stale index metrics.

## 8) Recovery action plan

If a connection does not progress after enabling:

1. Verify credentials and connection test status.
2. Verify global engine status is running.
3. Re-check active/dashboard/internal flags in the connection record.
4. Inspect progression logs and workflow snapshot APIs.
5. Restart global engine and re-run quick-start for targeted connection.
6. Run integrity script: `node scripts/verify-system-integrity.js`.

