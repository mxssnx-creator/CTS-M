# CTS v3.1 - Production Readiness Checklist

Complete verification checklist for production deployment.

## Pre-Deployment Verification

### 1. Database Setup ✓
- [x] SQLite default configuration (automatic)
- [x] PostgreSQL support ready (optional)
- [x] Migration system tested and functional
- [x] All 25 tables with proper indexes
- [x] Automatic initialization on startup
- [x] Health check endpoints available

**Verify:**
\`\`\`bash
# Start application
npm run dev

# Check database health
curl http://localhost:3000/api/health/database

# Check migration status
curl http://localhost:3000/api/admin/migrations/status
\`\`\`

### 2. Dependencies ✓
- [x] All npm packages installed
- [x] No security vulnerabilities
- [x] Production dependencies optimized
- [x] Deprecated packages removed

**Verify:**
\`\`\`bash
npm audit
npm list --depth=0
\`\`\`

### 3. Build System ✓
- [x] TypeScript compilation successful
- [x] No build errors
- [x] Optimized production build
- [x] Pre-build verification scripts

**Verify:**
\`\`\`bash
npm run type-check
npm run build
\`\`\`

### 4. File Structure ✓
- [x] Critical directories exist (data, scripts, lib, app, components)
- [x] Migration scripts present and valid
- [x] Configuration files properly set
- [x] No missing imports or broken references

**Verify:**
\`\`\`bash
node scripts/verify-startup.js
\`\`\`

### 5. Environment Configuration
- [ ] Production environment variables set
- [ ] Database credentials configured (if using PostgreSQL)
- [ ] Session secrets generated
- [ ] API keys configured (if needed)

**Production .env:**
\`\`\`bash
# Required
NODE_ENV=production
PORT=3000
SESSION_SECRET=<generate-secure-random-string>
JWT_SECRET=<generate-secure-random-string>
ENCRYPTION_KEY=<generate-secure-random-string>
API_SIGNING_SECRET=<generate-secure-random-string>

# Database (choose one)
# Option 1: SQLite (default - no configuration needed)

# Option 2: PostgreSQL
DATABASE_URL=postgresql://username:password@host:5432/database
\`\`\`

### 6. Security
- [ ] All secrets properly configured
- [ ] No hardcoded credentials in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled (if applicable)
- [ ] SQL injection protection verified

### 7. Performance
- [x] Database indexes optimized for high-frequency queries
- [x] Connection pooling configured
- [x] Caching strategy implemented
- [x] Static assets optimized

### 8. Monitoring & Logging
- [x] Console logging functional
- [x] Site logger system operational
- [x] Health check endpoints available
- [x] Error tracking configured

**Endpoints:**
- `/api/health/database` - Database connectivity
- `/api/admin/migrations/status` - Migration status

### 9. Backup & Recovery
- [ ] Backup strategy defined
- [ ] Database backup script tested
- [ ] Recovery procedure documented

**Backup SQLite:**
\`\`\`bash
npm run db:backup
# Or manually:
cp data/cts.db data/cts.db.backup.$(date +%Y%m%d_%H%M%S)
\`\`\`

**Backup PostgreSQL:**
\`\`\`bash
pg_dump -U username -d database -F c -f backup.dump
\`\`\`

### 10. Testing
- [ ] Application starts successfully
- [ ] Database initializes correctly
- [ ] All pages load without errors
- [ ] API endpoints respond correctly
- [ ] WebSocket connections stable (if used)

## Deployment Steps

### Step 1: Pre-Deployment
\`\`\`bash
# 1. Run verification
node scripts/verify-startup.js

# 2. Run type check
npm run type-check

# 3. Build for production
npm run build

# 4. Test production build locally
npm start
\`\`\`

### Step 2: Deploy
\`\`\`bash
# For Vercel
vercel --prod

# For manual deployment
npm install --production
npm run build
npm start
\`\`\`

### Step 3: Post-Deployment
\`\`\`bash
# 1. Verify deployment health
curl https://your-domain.com/api/health/database

# 2. Check migration status
curl https://your-domain.com/api/admin/migrations/status

# 3. Monitor logs for errors
# Check application logs for any startup errors
\`\`\`

## Quick Start (Zero Configuration)

For fastest deployment with SQLite:

\`\`\`bash
# 1. Clone and install
git clone <repo>
cd cts-v3.1
npm install

# 2. Start (database auto-initializes)
npm run dev

# 3. Open browser
# http://localhost:3000
\`\`\`

That's it! SQLite database creates automatically with all tables and indexes.

## Production with PostgreSQL

\`\`\`bash
# 1. Create .env.local
echo "DATABASE_URL=postgresql://user:pass@host:5432/db" > .env.local

# 2. Start application
npm run dev
# Database migrates automatically
\`\`\`

## Troubleshooting

### Database Issues
\`\`\`bash
# Check database status
npm run db:status

# Reset database (CAUTION: deletes all data)
npm run db:reset

# Re-run migrations
npm run db:migrate
\`\`\`

### Build Issues
\`\`\`bash
# Clean all caches
npm run clean:all

# Rebuild from scratch
npm run rebuild
\`\`\`

### Performance Issues
\`\`\`bash
# Check system health
npm run system:health

# Monitor database connections
# Check /api/health/database endpoint
\`\`\`

## Production Monitoring

### Health Checks
- **Database**: `GET /api/health/database`
  - Response: `{ status: "healthy", type: "sqlite|postgresql", uptime: number }`
  
- **Migrations**: `GET /api/admin/migrations/status`
  - Response: `{ applied: number, pending: number, tables: object }`

### Logs to Monitor
- Application startup logs
- Database connection logs
- Migration execution logs
- API error logs
- WebSocket connection logs (if used)

## Success Criteria

Application is production-ready when:
- ✓ All verification scripts pass
- ✓ Build completes without errors
- ✓ Database initializes successfully
- ✓ Health checks return positive status
- ✓ Application loads in browser
- ✓ No console errors in browser or server
- ✓ All critical pages accessible
- ✓ API endpoints responding correctly

## Support

For issues:
1. Check logs: console output and browser developer tools
2. Verify environment variables
3. Check database connectivity
4. Review migration status
5. Consult troubleshooting guides

---

**Last Updated:** v3.1.0
**Database System:** Production-Ready ✓
**Migration System:** Automatic ✓
**Startup Verification:** Enabled ✓
