# Local Development Guide - CTS v3.1

## Common Issues and Solutions

### Issue: Import Errors After Pulling Changes

If you see errors like:
\`\`\`
Export getTradeEngine doesn't exist in target module
import { getTradeEngine } from "@/lib/trade-engine/trade-engine"
\`\`\`

**This is a Turbopack cache issue.** The build system is reading stale cached versions of files.

### Solution: Clear All Local Caches

Run this command to clear all caches and restart:

\`\`\`bash
npm run clean:local && npm run dev
\`\`\`

Or manually:

\`\`\`bash
# Clear all caches
rm -rf .next .turbo tsconfig.tsbuildinfo node_modules/.cache

# Restart dev server
npm run dev
\`\`\`

### Alternative: Use dev:nocache

If you want to skip automatic cache clearing:

\`\`\`bash
npm run dev:nocache
\`\`\`

## NPX Installation Issues

If you're using `npx` to run the project and getting import errors:

1. **Clear your local cache first:**
   \`\`\`bash
   npm run clean:local
   \`\`\`

2. **Then start the dev server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **If issues persist, do a full clean:**
   \`\`\`bash
   npm run clean:all
   \`\`\`

## Vercel vs Local Development

- **Vercel builds work** because they start with a clean cache every time
- **Local builds fail** when Turbopack cache contains stale file versions
- **Solution**: Always clear cache after pulling changes or switching branches

## File Import Paths

### Correct Imports:

\`\`\`typescript
// ✅ CORRECT - Import from main file
import { getTradeEngine, GlobalTradeEngineCoordinator } from "@/lib/trade-engine"

// ✅ CORRECT - Import from directory index
import { TradeEngine, TradeEngineConfig } from "@/lib/trade-engine/"
\`\`\`

### Incorrect Imports (will cause errors):

\`\`\`typescript
// ❌ WRONG - Don't import from subdirectory file directly
import { getTradeEngine } from "@/lib/trade-engine/trade-engine"
\`\`\`

## Database Issues

If you see database connection errors:

1. **Check your environment variables:**
   \`\`\`bash
   cat .env.local
   \`\`\`

2. **For SQLite (default):**
   - Don't set `DATABASE_URL` or set it to `file:./data/db.sqlite`
   - Run: `npm run db:migrate`

3. **For PostgreSQL:**
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`
   - Run: `npm run db:migrate`

4. **Reset database if corrupted:**
   \`\`\`bash
   npm run db:reset
   \`\`\`

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (clears cache first) |
| `npm run dev:nocache` | Start dev server without clearing cache |
| `npm run clean:local` | Clear all local build caches |
| `npm run clean:all` | Nuclear option - removes node_modules too |
| `npm run type-check` | Check TypeScript errors without building |
| `npm run build` | Production build |
| `npm run db:migrate` | Run database migrations |
| `npm run db:status` | Check database status |
| `npm run system:check` | Run system health check |

## Best Practices

1. **Always clear cache after pulling changes:**
   \`\`\`bash
   git pull && npm run clean:local && npm run dev
   \`\`\`

2. **Before reporting build errors:**
   - Clear cache first
   - Try `npm run clean:all`
   - Check if Vercel build passes (it uses clean cache)

3. **Database migrations:**
   - Run migrations after pulling database schema changes
   - Backup database before running migrations in production

## Getting Help

If you're still experiencing issues after clearing caches:

1. Check the error message carefully
2. Verify all environment variables are set
3. Make sure you're on the correct Node.js version (18-26)
4. Try a complete reinstall: `npm run clean:all`
</markdown>
