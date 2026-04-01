# CTS v3 Recreation Guide (Project Rebuild + Operations Reference)

## 1) Purpose

This guide is a **single-source operational reference** for recreating this CTS v3 instance from scratch, including:

- environment and runtime setup
- startup and migration lifecycle
- exchange/base-connection model and API-key handling
- page/menu structure
- authentication behavior (including current default-login behavior)
- practical checks for a successful restore

---

## 2) Runtime + Core Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React + Tailwind + shadcn/radix components
- **Primary storage/runtime state:** Redis
- **Auth primitives available server-side:** JWT + cookie session helpers
- **Current app layout model:** Sidebar-driven dashboard shell

The startup entrypoint uses `instrumentation.ts` and delegates initialization to `runPreStartup()` in `lib/pre-startup.ts`.

---

## 3) High-Level Recreation Steps

1. Install dependencies.
2. Provide environment variables (Redis + app URL + secrets).
3. Start app in Node runtime (startup instrumentation executes).
4. Let pre-startup initialize Redis and run migrations.
5. Confirm `_schema_version` is at latest migration.
6. Validate canonical base connections exist.
7. Open UI and verify pages/menu and protected routes render.
8. Validate engine/global-state + connection monitor behavior.

---

## 4) Startup + Migration Lifecycle (Redis)

## Startup chain

- `instrumentation.ts` calls `runPreStartup()` in Node runtime.
- `runPreStartup()` initializes Redis, runs migration flow, seeds defaults, and starts engine-related background tasks.

## Migration behavior

Migration definitions are in `lib/redis-migrations.ts`.

- Schema version key: `_schema_version`
- In-process run guard: `_migrations_run` + process-level guard
- Latest defined migration version: **17**

### Migration milestones (condensed)

- **v1–v10:** core schema, metadata, monitoring, caching, settings foundations
- **v11:** seeded canonical connections (`bybit-x03`, `bingx-x01`, `pionex-x01`, `orangex-x01`)
- **v12–v14:** template/base normalization and legacy updates
- **v15–v16:** narrowed main/base active auto-assignment to Bybit + BingX
- **v17:** cleanup/reset pass ensuring only Bybit/BingX are main/active inserted defaults

---

## 5) Exchanges, Connection IDs, and Key Handling

## Canonical base connection IDs

- `bybit-x03`
- `bingx-x01`
- `pionex-x01`
- `orangex-x01`

## Current base-state policy

- By default, **Bybit + BingX** are treated as the primary active/main baseline in migration cleanup logic.
- Pionex/OrangeX remain canonical templates/base entries but are not default main active in the latest cleanup behavior.

## Credential source currently in repo

The current codebase includes a hardcoded credential map in `lib/base-connection-credentials.ts`.

### Recommendation for reproducible + secure recreation

For production-grade recreation:

1. Move all exchange credentials to environment variables or secret manager.
2. Keep only placeholder values in source control.
3. Rotate any exposed credentials immediately.
4. Restrict keys by IP, scope, and withdrawal permissions.
5. Keep separate keys per environment (dev/stage/prod).

---

## 6) Auth Model + Default Login Behavior

## Server-side auth utilities (available)

`lib/auth.ts` provides:

- bcrypt password hash/verify
- JWT issue/verify (`7d` expiration)
- cookie session helpers (`auth_token`)
- request auth verification helper

## Current client-side runtime behavior (important)

`lib/auth-context.tsx` currently preloads an admin user in memory and treats the app as logged-in by default:

- user: `Administrator`
- email: `mxssnx@gmail.com`
- role: `admin`
- token placeholder: `admin-token-disabled`

`login()` and `register()` in the client auth context currently return success and set the same in-memory admin identity.

### Practical implication

- In this current build, UI auth guard behavior is effectively bypassed by default pre-auth state.
- There is **no required default password** for dashboard access in this mode.

### Redis migration auth seed note

Migration v5 also seeds a Redis admin user record (`admin-001`, username `admin`, email `admin@trading-engine.local`) for server-side auth infrastructure.

---

## 7) Page + Section + Menu Structure

Sidebar structure is defined in `components/app-sidebar.tsx`.

## Main navigation

- Overview (`/`)
- Live Trading (`/live-trading`)
- Presets (`/presets`)
- Indications (`/indications`)
- Strategies (`/strategies`)
- Statistics (`/statistics`)
- Position Analysis (`/analysis`)
- Structure (`/structure`)
- Logistics (`/logistics`)
- Monitoring (`/monitoring`)
- Settings (`/settings`)

## Testing section

- Connection (`/testing/connection`)
- Engine (`/testing/engine`)

## Additional section

- Chat History (`/additional/chat-history`)
- Volume Corrections (`/additional/volume-corrections`)

## Authentication pages

- Login (`/login`)
- Register (`/register`)

---

## 8) Settings Area (Primary Operations Surface)

The settings page composes tabbed operational modules and includes:

- overall/system overview tabs
- exchange connection manager
- indication and strategy parameter surfaces
- install/maintenance controls (including migration triggers in UI flows)
- logs/statistics utility components

This is the primary operator cockpit for:

- connection management and testing
- system-level tuning
- migration-related operational actions

---

## 9) Recovery / Rebuild Validation Checklist

After recreating environment:

1. App boots without startup exceptions.
2. Redis reachable and initialized.
3. `_schema_version` equals latest migration version.
4. Canonical connections exist with expected IDs.
5. Dashboard loads with sidebar + all menu groups.
6. Settings and logistics/monitoring pages respond.
7. Trade-engine global status key exists and monitor loop starts.
8. Connection auto-start monitor does not duplicate timers across re-init calls.

---

## 10) Recommended Hardening Tasks (Post-Recreation)

1. Remove hardcoded exchange credentials from repository.
2. Enforce real server-side auth flow (disable default in-memory admin bypass).
3. Add explicit role-based access control for admin APIs.
4. Add automated smoke tests for startup/migration/engine-monitor paths.
5. Add CI guard to detect committed secrets.

---

## 11) Quick File Index

- Startup registration: `instrumentation.ts`
- Pre-start lifecycle: `lib/pre-startup.ts`
- Redis migrations: `lib/redis-migrations.ts`
- Base credentials map: `lib/base-connection-credentials.ts`
- Auth utilities (server): `lib/auth.ts`
- Auth behavior (client context): `lib/auth-context.tsx`
- Sidebar/menu: `components/app-sidebar.tsx`
- Main settings page: `app/settings/page.tsx`

