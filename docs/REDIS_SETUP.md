# Redis Persistent Storage Setup

## Current Issue

The system is using **in-memory fallback storage** which loses all data on restart. You need to configure a Redis database for persistent storage.

## Solution: Configure Upstash Redis (Free Tier Available)

### Step 1: Create Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up or log in
3. Click "Create Database"
4. Choose:
   - Name: `cts-trading-system`
   - Type: **Regional** (faster) or Global
   - Region: Choose closest to your deployment
   - TLS: **Enabled** (recommended)
5. Click "Create"

### Step 2: Get Connection Details

After creating the database, copy these values from the "REST API" section:
- `UPSTASH_REDIS_REST_URL` 
- `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Add Environment Variables to Vercel

#### Option A: Using Vercel Dashboard
1. Go to your Vercel project settings
2. Navigate to "Settings" → "Environment Variables"
3. Add these two variables:
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: (paste from Upstash)
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: (paste from Upstash)
4. Select all environments (Production, Preview, Development)
5. Click "Save"

#### Option B: Using Vercel CLI
```bash
vercel env add UPSTASH_REDIS_REST_URL
# Paste your URL when prompted

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your token when prompted
```

### Step 4: Redeploy

After adding environment variables:
1. Go to your Vercel project
2. Click "Deployments" tab
3. Click "..." menu on latest deployment
4. Click "Redeploy"
5. Select "Use existing Build Cache"

### Step 5: Verify

After redeployment, check the logs. You should see:
```
[v0] [Redis] ✓ Redis database initialized successfully with persistent storage
```

Instead of:
```
[v0] [Redis] ✗ No Redis URL configured!
[v0] [Redis] Using fallback in-memory store (data will be lost on restart)
```

## Alternative: Use Standard Redis URL

If you prefer a different Redis provider, you can use:
- Environment Variable: `REDIS_URL`
- Format: `redis://username:password@host:port`

Example providers:
- Redis Cloud
- AWS ElastiCache
- DigitalOcean Managed Redis
- Railway Redis

## Verification Commands

Once configured, your system will automatically:
1. Connect to Redis on startup
2. Run database migrations (schema version 11)
3. Seed default exchange connections
4. Persist all data (connections, trades, positions, market data)
5. Maintain data across deployments and restarts

## Support

If you see "No Redis URL configured" in logs, environment variables are not properly set. Double-check:
1. Variable names are exactly correct (case-sensitive)
2. Values are copied completely without extra spaces
3. Variables are enabled for the correct environment (Production/Preview)
4. Project has been redeployed after adding variables
