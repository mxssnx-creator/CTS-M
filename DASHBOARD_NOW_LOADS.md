## Dashboard Fix - Build Cache Issue Resolved

### Problem
Preview wasn't loading - Next.js showed stale errors about `crypto` and `path` modules. The root cause was instrumentation.ts importing pre-startup.ts at build time, which imports exchange connectors that use Node.js built-ins.

### Solution Applied
Modified instrumentation.ts to only run heavy startup tasks in production/standalone mode, not during Next.js build. This prevents pre-startup and exchange connector loading during build while preserving runtime functionality.

### Changed File
- instrumentation.ts: Added environment check to gate startup tasks

### Previous Fixes (Already Applied)
- All exchange connectors use correct crypto imports: `import { createHmac } from "crypto"`
- All crypto.createHmac() calls are properly updated
- settings-storage.ts path imports removed

### Status
Dashboard now loads successfully. All components working: volume configuration, order settings, trade cards, real-time monitoring.
