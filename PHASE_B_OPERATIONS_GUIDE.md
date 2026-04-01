# Phase B: Operations & Production Hardening Guide

## Phase B.1: Database Metrics & Slow Query Logging

### Overview
Comprehensive database performance monitoring with automatic slow query detection.

### Key Features
- Real-time query metrics collection
- Slow query threshold alerting (default: 100ms)
- Command-level statistics
- Performance pattern analysis
- Query history (10,000 queries)

### Usage

```typescript
import { dbMetrics } from '@/lib/database-metrics'

// Record query execution
dbMetrics.recordQuery('SET', 50, true) // success
dbMetrics.recordQuery('GET', 250, false, new Error('timeout'))

// Get health status
const health = dbMetrics.getHealth()
console.log(health.slowQueryCount) // Number of slow queries
console.log(health.health) // 'healthy' | 'degraded' | 'critical'

// Analyze patterns
const patterns = dbMetrics.analyzePatterns(300000) // 5-minute window
console.log(patterns.hotkeys) // Most frequent operations
console.log(patterns.bottlenecks) // Slowest operations
console.log(patterns.errorPatterns) // Operations with errors
```

### API Endpoints

```
GET /api/database/metrics         # Current metrics
GET /api/database/slow-queries    # Recent slow queries
GET /api/database/patterns        # Query patterns
GET /api/database/health          # Database health status
```

---

## Phase B.2: Performance Dashboards

### Overview
Real-time performance visualization and trend analysis.

### Features
- Current metrics snapshot
- Historical trends (24 hours)
- Anomaly detection
- HTML dashboard export
- Circuit breaker status
- Service health indicators

### Usage

```typescript
import { performanceDashboard } from '@/lib/performance-dashboard'

// Start periodic collection
performanceDashboard.startPeriodicCollection(60000) // Every 60s

// Get current metrics
const current = performanceDashboard.getCurrentMetrics()

// Get historical data
const history = performanceDashboard.getHistoricalMetrics(60) // Last 60 minutes

// Analyze trends
const trends = performanceDashboard.analyzeTrends()

// Export HTML
const html = performanceDashboard.generateHTML()
```

### Dashboard Metrics
- System uptime
- Memory usage (trend)
- Error rate (trend)
- Average response time
- P95/P99 latency
- Service health status
- Anomaly detection

---

## Phase B.3: Backup System

### Overview
Automated Redis backups with integrity verification.

### Features
- Automated daily backups
- 7-day retention policy
- Backup verification
- Point-in-time recovery
- Backup metadata tracking
- Size and key count metrics

### Usage

```typescript
import { backupSystem } from '@/lib/backup-system'

// Create backup manually
const backup = await backupSystem.createBackup()

// Schedule automatic backups (hourly)
backupSystem.scheduleBackups(3600000)

// List all backups
const backups = backupSystem.listBackups()

// Verify backup
const verification = await backupSystem.verifyBackup('backup-123')

// Restore from backup
await backupSystem.restoreBackup('backup-123')

// Check status
const status = backupSystem.getStatus()
```

### Backup Strategy
1. **Daily backups**: Automated backup every 24 hours
2. **7-day retention**: Keep latest 7 backups
3. **Verification**: Verify integrity before restoration
4. **Testing**: Weekly restore tests (recommended)
5. **Off-site**: Copy to cloud storage monthly (recommended)

---

## Phase B.4: Load Testing & Baseline

### Overview
Establish system performance baseline and identify capacity limits.

### Features
- Configurable load parameters
- Realistic operation mix (70% read, 25% write, 5% delete)
- Concurrent request handling
- Rate limiting simulation
- Baseline comparison

### Usage

```typescript
import { loadTester } from '@/lib/load-testing'

// Establish baseline (60s, 100 req/s, 10 concurrent)
const baseline = await loadTester.establishBaseline()

// Run custom load test
const result = await loadTester.runLoadTest({
  duration: 120,
  concurrency: 50,
  requestsPerSecond: 500,
  operationMix: { read: 70, write: 25, delete: 5 }
})

// Compare to baseline
const comparison = loadTester.compareToBaseline(result)

// Get all results
const results = loadTester.getResults()
```

### Performance Targets
- **Throughput**: >100 req/s
- **Avg Response Time**: <100ms
- **P95 Latency**: <500ms
- **P99 Latency**: <1000ms
- **Error Rate**: <1%

---

## Phase B.5: Security Hardening

### Overview
OWASP-aligned security implementations.

### Features
- Input validation & sanitization
- Password hashing
- Data encryption
- Origin validation
- Suspicious activity detection
- Audit logging
- Security scoring

### Usage

```typescript
import { securityManager } from '@/lib/security-hardening'

// Validate input
const validation = securityManager.validateInput(userInput, {
  type: 'string',
  required: true,
  minLength: 3,
  maxLength: 100,
  pattern: /^[a-zA-Z0-9]+$/
})

// Sanitize input
const clean = securityManager.sanitizeInput(untrustedInput)

// Password operations
const hash = securityManager.hashPassword(password)
const isValid = securityManager.verifyPassword(password, hash)

// Encryption
const encrypted = securityManager.encryptData(sensitiveData)
const decrypted = securityManager.decryptData(encrypted)

// Check suspicious activity
if (securityManager.checkSuspiciousActivity(userId, 5)) {
  // Alert: too many suspicious attempts
}

// Audit logging
securityManager.logSecurityEvent({
  type: 'access',
  action: 'login_attempt',
  resource: 'auth_endpoint',
  status: 'success',
  userId: user.id
})

// Get security report
const report = securityManager.exportReport()
```

### Security Checklist
- [x] Input validation on all endpoints
- [x] SQL injection prevention (using parameterized queries)
- [x] XSS protection (output encoding)
- [x] CSRF token validation
- [x] Rate limiting active
- [x] Audit logging enabled
- [x] Encryption at rest
- [x] TLS/SSL for transport
- [x] Password hashing (SHA-256)
- [x] Security headers configured

---

## Phase B.6: Disaster Recovery

### RTO/RPO Targets
- **RTO (Recovery Time Objective)**: <15 minutes
- **RPO (Recovery Point Objective)**: <1 hour

### Recovery Procedures

#### Backup Recovery
```
1. Identify last good backup
2. Verify backup integrity
3. Stop trade engine
4. Restore backup
5. Verify data consistency
6. Resume operations
```

#### Database Recovery
```
1. Check Redis connectivity
2. Attempt automated heal
3. If failed, restore from backup
4. Restart services
5. Run health checks
```

#### Full System Recovery
```
1. Restart application
2. Run database migrations
3. Restore from backup if needed
4. Run health checks
5. Run integration tests
6. Resume trading operations
```

---

## Phase B.7: Incident Response

### Severity Levels
1. **Critical**: System down, data loss, security breach
2. **High**: Significant degradation, partial outage
3. **Medium**: Intermittent issues, performance degradation
4. **Low**: Minor issues, cosmetic problems

### Response Process
1. **Detect** → Alert triggered
2. **Assess** → Severity evaluation
3. **Respond** → Execute recovery
4. **Communicate** → Update stakeholders
5. **Document** → Post-incident analysis

### Runbook Examples

#### Circuit Breaker Open Alert
```
1. Check service status: GET /api/health
2. Review error logs: journalctl -u app -n 100
3. If DB issue: Check Redis connectivity
4. If API issue: Check external service status
5. Manual recovery: Reset circuit breaker
6. Monitor closely: Watch metrics for 15 minutes
```

#### High Memory Usage Alert
```
1. Check current memory: Free system memory
2. Review metrics: /api/metrics (process_memory_heap_used)
3. Check for memory leak: grep "Memory leak" logs
4. Take heap dump for analysis
5. Restart if necessary
6. Investigate root cause
```

---

## Phase B.8: Monitoring & Alerting

### Key Metrics to Monitor

**System Metrics:**
- CPU usage (alert if >80%)
- Memory usage (alert if >85%)
- Disk usage (alert if >90%)
- Network latency (alert if >500ms)

**Application Metrics:**
- Request latency (P95 >500ms)
- Error rate (>2%)
- Circuit breaker status (state = OPEN)
- Queue depth (>1000 items)

**Database Metrics:**
- Slow queries (>100ms)
- Connection pool (>80% utilized)
- Query errors (>1%)
- Response time (P99 >500ms)

### Alert Actions
1. **Critical**: Page on-call engineer immediately
2. **High**: Send Slack notification + email
3. **Medium**: Send Slack notification
4. **Low**: Log for review

---

## Phase B.9: Maintenance Windows

### Weekly Maintenance
- Review error logs
- Check backup status
- Analyze performance trends
- Update dependencies

### Monthly Maintenance
- Full backup test/restore
- Security patches
- Performance tuning
- Capacity planning

### Quarterly Maintenance
- Disaster recovery drill
- Load testing
- Security audit
- Architecture review

---

## Health Check Commands

```bash
# Full health check
curl http://localhost:3001/api/health

# Readiness probe
curl http://localhost:3001/api/health/readiness

# Liveness probe
curl http://localhost:3001/api/health/liveness

# Metrics export
curl http://localhost:3001/api/metrics

# Database metrics
curl http://localhost:3001/api/database/metrics

# Circuit breaker status
curl http://localhost:3001/api/system/circuit-breakers
```

---

## Performance Tuning

### Database Tuning
- Increase slow query threshold if false positives
- Add indexes for frequently accessed keys
- Implement caching for hot queries

### Application Tuning
- Adjust circuit breaker thresholds
- Tune rate limiter settings
- Optimize database connection pool

### System Tuning
- Increase file descriptor limits
- Optimize memory allocation
- Tune network buffer sizes

---

## Contact & Escalation

- **On-Call**: Check PagerDuty rotation
- **Slack**: #production-alerts channel
- **Email**: operations@company.com
- **Emergency**: See incident runbook

---

# Phase B Integration Checklist

## Deployment Checklist
- [ ] Database metrics collector initialized
- [ ] Performance dashboard running
- [ ] Backup system scheduled
- [ ] Load testing baseline established
- [ ] Security hardening active
- [ ] Disaster recovery plan tested
- [ ] Operations team trained
- [ ] All documentation reviewed
- [ ] Health checks passing
- [ ] Metrics flowing correctly
- [ ] Alerts configured
- [ ] Runbooks accessible

## Team Training Topics
1. System architecture overview
2. Monitoring and alerting
3. Incident response procedures
4. Backup and recovery
5. Security best practices
6. Performance tuning
7. Emergency contacts
8. Escalation procedures

## Metrics Dashboard Setup
- Configure Prometheus scraping
- Add Grafana dashboards
- Set up alert rules
- Configure notification channels
- Test alert delivery

## Success Criteria
- ✅ Production readiness score: 80+/100
- ✅ System availability: 99.5%+
- ✅ Error rate: <1%
- ✅ Mean response time: <100ms
- ✅ Alert response time: <5 minutes
- ✅ RTO/RPO targets: <15min / <1hour
