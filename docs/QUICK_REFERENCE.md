# CTS v3.1 - Quick Reference Guide

## 🚀 Quick Start

### Start the Application
```bash
npm run dev          # Development mode
npm start           # Production mode
```

### Verify System Health
```bash
npm run test:quick   # Quick file structure check
npm run test:api     # API endpoint testing
npm run health       # Live health check
```

## 📡 API Endpoints

### Monitoring
```bash
# Comprehensive metrics (ALL data in one call)
GET /api/monitoring/comprehensive

# System states
GET /api/monitoring/system

# Health check
GET /api/system/health-check
```

### Trade Engine
```bash
# Start engine
POST /api/trade-engine/start
Body: { "connectionId": "your-id" }

# Stop engine
POST /api/trade-engine/stop
Body: { "connectionId": "your-id" }

# Get status
GET /api/trade-engine/status

# Get progression
GET /api/trade-engine/progression
```

### Connections
```bash
# Test connection
POST /api/settings/connections/{id}/test

# Toggle connection
POST /api/settings/connections/{id}/toggle
Body: { "is_enabled": true, "is_live_trade": false }
```

## 🔧 Common Tasks

### Add New Connection
1. Create connection via UI or API
2. Test: `POST /api/settings/connections/{id}/test`
3. Enable: `POST /api/settings/connections/{id}/toggle`
4. Start engine: `POST /api/trade-engine/start`

### Monitor System
```bash
# Quick health
curl http://localhost:3000/api/system/health-check | jq

# Full metrics
curl http://localhost:3000/api/monitoring/comprehensive | jq

# Specific component
curl http://localhost:3000/api/monitoring/comprehensive | jq '.tradeEngines'
```

### Check Logs
```bash
# Application logs
pm2 logs cts-v3

# System logs
tail -f /var/log/cts-*.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🗂️ File Locations

### Configuration
- `/data/connections.json` - Exchange connections
- `/data/settings.json` - System settings
- `.env.local` - Environment variables

### Logs
- `/data/logs/` - Application logs
- `/var/log/nginx/` - Nginx logs
- `~/.pm2/logs/` - PM2 process logs

### Scripts
- `/scripts/quick-system-check.js` - System verification
- `/scripts/test-api-integration.js` - API testing
- `/scripts/verify-system-integrity.js` - Full integrity check

## 🏥 Health Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| `healthy` | All systems operational | None |
| `degraded` | Some issues detected | Review logs |
| `critical` | Major problems | Immediate action |
| `error` | System failure | Emergency response |

## 🔍 Troubleshooting

### Engine Won't Start
```bash
# 1. Check connection is enabled
curl http://localhost:3000/api/monitoring/comprehensive | jq '.connections'

# 2. Test connection first
curl -X POST http://localhost:3000/api/settings/connections/{id}/test

# 3. Check logs
pm2 logs cts-v3 --lines 50
```

### High Error Rate
```bash
# Check error summary
curl http://localhost:3000/api/monitoring/comprehensive | jq '.errors'

# Review recent errors
curl http://localhost:3000/api/monitoring/comprehensive | jq '.errors.recent'
```

### Connection Test Fails
```bash
# 1. Verify credentials in data/connections.json
cat data/connections.json | jq '.[] | {id, name, exchange}'

# 2. Check rate limiting
cat data/settings.json | jq '.minimumConnectInterval'

# 3. Test manually
curl -X POST http://localhost:3000/api/settings/connections/{id}/test -v
```

## 📊 Performance Benchmarks

### Expected Response Times
- Health check: < 200ms
- Comprehensive monitoring: < 1000ms
- Connection test: < 30s
- Engine start: < 5s

### Resource Usage (Normal)
- Memory: < 500MB
- CPU: < 20%
- Database connections: < 10

## 🛡️ Security Checklist

- [ ] API keys secured in environment variables
- [ ] Database credentials not in code
- [ ] HTTPS enabled in production
- [ ] File permissions properly set
- [ ] Regular security updates applied

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `COMPREHENSIVE_SYSTEM_AUDIT.md` | Full system audit report |
| `SYSTEM_VERIFICATION.md` | Testing & verification guide |
| `DEPLOYMENT_CHECKLIST.md` | Production deployment steps |
| `AUDIT_FIXES_SUMMARY.md` | Summary of fixes applied |
| `SYSTEM_WORKFLOWS.md` | Workflow documentation |
| `QUICK_REFERENCE.md` | This file |

## 🎯 Key Workflows

### Daily Operations
1. Check health: `npm run health`
2. Review errors via monitoring endpoint
3. Verify engine status
4. Monitor trade activity

### Weekly Maintenance
1. Review logs: `pm2 logs`
2. Check system metrics
3. Verify backups
4. Update if needed

### Monthly Tasks
1. Full system audit
2. Performance review
3. Security updates
4. Backup testing

## 🆘 Emergency Contacts

### System Issues
1. Check `/api/system/health-check`
2. Review `/api/monitoring/comprehensive`
3. Check PM2 logs: `pm2 logs cts-v3`
4. Review system logs

### Quick Recovery
```bash
# Restart application
pm2 restart cts-v3

# Reload Nginx
sudo systemctl reload nginx

# Clear cache and restart
npm run clean && pm2 restart cts-v3
```

## 💡 Pro Tips

1. **Use jq for JSON** - `curl api-endpoint | jq`
2. **Monitor continuously** - `watch -n 5 'curl -s localhost:3000/api/system/health-check | jq'`
3. **Save common queries** - Create shell aliases for frequent checks
4. **Set up alerts** - Configure monitoring tools for critical metrics
5. **Regular backups** - Automate daily backups via cron

## 🔗 Quick Links

- Health Check: `http://localhost:3000/api/system/health-check`
- Comprehensive Metrics: `http://localhost:3000/api/monitoring/comprehensive`
- Engine Status: `http://localhost:3000/api/trade-engine/status`
- Progression: `http://localhost:3000/api/trade-engine/progression`

---

**Last Updated:** 2026-01-27  
**Version:** 3.1.0  
**For detailed information, see the full documentation files listed above.**
