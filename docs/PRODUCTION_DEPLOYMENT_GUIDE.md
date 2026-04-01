# Production Deployment Guide for CTS v3

## System Overview

CTS v3 is a production-ready crypto trading dashboard with comprehensive real-time capabilities, advanced monitoring, and professional-grade infrastructure.

**Current Status:** ✅ **PRODUCTION READY**

## Pre-Deployment Checklist

### 1. System Verification

```bash
# Run all verification scripts
bun scripts/verify-api-endpoints.ts      # Test 25+ API endpoints
bun scripts/verify-prehistoric-data.ts   # Verify market data completeness
bun scripts/benchmark-system.ts          # Profile system performance

# Run quality gates
bun typecheck  # TypeScript strict mode
bun lint       # ESLint validation
bun run build  # Production build
```

### 2. Database Setup

```bash
# Initialize Redis
redis-server                              # Start Redis server
# Migrations run automatically on startup via runPreStartup()

# Verify Redis
redis-cli ping                            # Should return PONG
redis-cli INFO stats                      # Check Redis statistics
```

### 3. Environment Configuration

Create `.env.local` with:

```bash
# Authentication
AUTH0_SECRET=<your_secret>
AUTH0_BASE_URL=<your_domain>
AUTH0_ISSUER_BASE_URL=<your_issuer>
AUTH0_CLIENT_ID=<your_client_id>
AUTH0_CLIENT_SECRET=<your_client_secret>

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com
NODE_ENV=production

# API Credentials (optional - for live trading)
BINGX_API_KEY=<your_key>
BINGX_API_SECRET=<your_secret>
```

### 4. Performance Tuning

#### Redis Configuration
```bash
# In redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

#### Node.js Settings
```bash
# Increase file descriptors
ulimit -n 65535

# Enable clustering (optional)
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Deployment Options

### Option 1: Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy source
COPY . .

# Install dependencies
RUN bun install

# Build application
RUN bun run build

# Start application
EXPOSE 3001
CMD ["bun", "start"]
```

```bash
# Build and run
docker build -t cts-v3 .
docker run -p 3001:3001 \
  --env-file .env.local \
  --link redis:redis \
  cts-v3
```

### Option 2: Vercel Deployment

```bash
# Deploy to Vercel
vercel deploy --prod

# Set environment variables in Vercel dashboard
# Automatic rebuilds on git push
```

### Option 3: Traditional Server Deployment

```bash
# SSH into server
ssh user@server.com

# Clone repository
git clone <repo-url>
cd cts-v3

# Install dependencies
bun install

# Build application
bun run build

# Start with PM2
npm install -g pm2
pm2 start "bun start" --name "cts-v3" --instances max

# Enable auto-restart
pm2 startup
pm2 save
```

## Monitoring & Operations

### 1. Health Checks

**API Health Endpoint:**
```bash
curl https://your-domain.com/api/system/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T10:30:00Z",
  "components": {
    "redis": "healthy",
    "engines": "running",
    "broadcaster": "active"
  }
}
```

### 2. Real-Time Monitoring

Access the monitoring dashboard:
```
https://your-domain.com/monitoring-advanced
```

Key metrics to watch:
- SSE connection count
- Broadcaster client count
- Processing phase progress
- Average cycle duration
- Position and evaluation counts

### 3. Log Management

**Application Logs:**
```bash
# PM2 logs
pm2 logs cts-v3

# Docker logs
docker logs <container-id> -f
```

**System Logs Location:**
- Progression logs: Redis `progression_logs:{connectionId}`
- Processing metrics: Redis `processing_metrics:{connectionId}`
- System stats: API endpoint `/api/system/monitoring`

### 4. Performance Monitoring

**Key Performance Indicators:**

1. **API Response Time**
   - Target: <100ms average
   - Warning: >200ms
   - Critical: >500ms

2. **SSE Message Latency**
   - Target: <50ms
   - Warning: >100ms
   - Critical: >200ms

3. **Processing Cycle Duration**
   - Target: <5s
   - Warning: >10s
   - Critical: >20s

4. **Memory Usage**
   - Target: <500MB
   - Warning: >1GB
   - Critical: >2GB

5. **Redis Memory**
   - Target: <1GB
   - Warning: >1.5GB
   - Critical: >2GB

**Monitor with:**
```bash
# Node.js process monitor
pm2 monit

# Redis memory
redis-cli INFO memory

# System resources
top -p $(pidof node)
```

## Troubleshooting Guide

### Issue: High Memory Usage

**Symptoms:** Memory > 1GB

**Solutions:**
1. Clear old message history: `redis-cli FLUSHDB --ASYNC`
2. Reduce processing metrics retention: Modify `MAX_HISTORY_SIZE` in `lib/processing-metrics.ts`
3. Increase Node.js heap: `NODE_OPTIONS="--max-old-space-size=4096"`

### Issue: Slow API Responses

**Symptoms:** API response time > 200ms

**Solutions:**
1. Check Redis latency: `redis-cli --latency`
2. Monitor database queries: `redis-cli MONITOR`
3. Check network connectivity
4. Scale horizontally (add more instances)

### Issue: SSE Connection Drops

**Symptoms:** Frequent reconnections, timeouts

**Solutions:**
1. Increase heartbeat interval: Modify `HEARTBEAT_INTERVAL` in `/api/ws/route.ts`
2. Check proxy timeout settings
3. Verify network stability
4. Review firewall rules (may be closing idle connections)

### Issue: Position Updates Not Appearing

**Symptoms:** Real-time updates lag or missing

**Solutions:**
1. Verify SSE client connection: Open browser DevTools → Network → WS filter
2. Check broadcaster status: Visit `/monitoring-advanced`
3. Restart trade engine: `/api/trade-engine/restart`
4. Review error logs: `pm2 logs cts-v3 | grep ERROR`

## Backup & Recovery

### Backup Strategy

```bash
# Backup Redis data (weekly)
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backups/redis-$(date +%Y%m%d).rdb

# Backup application data (daily)
tar czf /backups/app-$(date +%Y%m%d).tar.gz /path/to/app

# Archive old backups (monthly)
find /backups -name "*.rdb" -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore Redis
redis-cli SHUTDOWN
cp /backups/redis-YYYYMMDD.rdb /var/lib/redis/dump.rdb
redis-server

# Restore application
cd /path/to/app
git reset --hard HEAD
git pull origin main
bun install
bun run build
pm2 restart cts-v3
```

## Security Checklist

- [ ] Auth0 credentials configured
- [ ] Environment variables set (not in code)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall rules configured
- [ ] Rate limiting enabled (API endpoints)
- [ ] CORS properly configured
- [ ] SQL injection prevention (N/A - using Redis)
- [ ] XSS protection enabled (Next.js default)
- [ ] CSRF tokens implemented (Next.js default)
- [ ] Redis authentication configured (if exposed)
- [ ] Regular security updates (dependencies)
- [ ] Monitoring and alerting configured

## Scaling Guide

### Horizontal Scaling

For multiple server instances:

```bash
# Load balancer configuration (nginx)
upstream cts_backend {
  server app1.local:3001;
  server app2.local:3001;
  server app3.local:3001;
}

server {
  listen 443 ssl;
  location / {
    proxy_pass http://cts_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "upgrade";
    proxy_set_header Upgrade $http_upgrade;
  }
}
```

### Vertical Scaling

Single server optimization:

- Increase Node.js workers: `NODE_CLUSTER_WORKERS=8`
- Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=8192"`
- Configure Redis persistence: `appendonly yes`
- Enable connection pooling

## Disaster Recovery Plan

### Recovery Time Objective (RTO)
- **Target:** 15 minutes
- **Method:** Automated failover + data restore

### Recovery Point Objective (RPO)
- **Target:** 5 minutes
- **Method:** Redis persistence every 60 seconds

### Disaster Recovery Steps

1. **Detect Failure**
   - Monitor heartbeat (30s timeout)
   - Alert if unresponsive

2. **Activate Backup**
   - Switch DNS to secondary instance
   - Restore latest Redis backup
   - Verify data integrity

3. **Restore Service**
   - Start all services
   - Run verification scripts
   - Monitor for 15 minutes

4. **Communicate**
   - Notify users of outage
   - Provide status updates
   - Post-mortem analysis

## Maintenance Schedule

### Daily
- Monitor system health
- Check error logs
- Verify processing cycles

### Weekly
- Backup Redis database
- Run performance benchmarks
- Review monitoring dashboard

### Monthly
- Update dependencies: `bun update`
- Security scan: `npm audit`
- Performance review
- Capacity planning

### Quarterly
- Major version updates
- Full disaster recovery test
- Security audit
- User feedback review

## Support & Documentation

**Documentation Files:**
- `docs/SSE_REAL_TIME_GUIDE.md` - Real-time architecture
- `docs/SYSTEM_COMPLETION_REPORT.md` - System overview
- `docs/SESSION_4_COMPLETION.md` - Implementation details
- `scripts/verify-api-endpoints.ts` - API testing
- `scripts/benchmark-system.ts` - Performance profiling

**Useful Commands:**

```bash
# Start development server
bun dev

# Production build and start
bun run build
bun start

# Run type checking
bun typecheck

# Run linting
bun lint

# Run tests
bun test

# Database operations
redis-cli                    # Connect to Redis
redis-cli FLUSHDB           # Clear all data
redis-cli INFO              # System information
redis-cli KEYS '*'          # List all keys
```

## Conclusion

CTS v3 is a fully operational, production-grade trading dashboard with comprehensive real-time capabilities. Follow this deployment guide for a smooth production launch.

**System Status:** ✅ PRODUCTION READY

For issues or questions, refer to the comprehensive documentation in `/docs` or review the system logs via the monitoring dashboard.

---

Generated: 2026-03-25
Version: 1.0
Status: PRODUCTION READY
