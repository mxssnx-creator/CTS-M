# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Extended with production-facing trading dashboard fixes

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

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |
| `components/settings/connection-card.tsx` | Connection UI + logs | ✅ Updated |

## Current Focus

The template is ready. Trading dashboard and connection log presentation were improved for progression visibility:

1. Additional production engine fixes and endpoint hardening
2. Broader statistics/DB verification on real data paths
3. Further log categorization and operational dashboards
4. Unified metrics derivation across monitoring, quickstart dialogs, and connection log summaries

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
