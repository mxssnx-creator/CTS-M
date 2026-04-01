# Vercel Deployment Guide - CTS v3.1

## Overview
This guide covers deploying CTS v3.1 to Vercel with proper configuration.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Environment Variables**: Prepare all required env vars
3. **Database**: PostgreSQL instance (recommended: Neon, Supabase, or Vercel Postgres)

## Required Environment Variables

Configure these in your Vercel project settings:

\`\`\`bash
# Database
REMOTE_POSTGRES_URL=postgresql://user:password@host:5432/database

# Security Keys (generate with: openssl rand -base64 32)
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
API_SIGNING_SECRET=your_api_signing_secret_here

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
\`\`\`

## Deployment Steps

### 1. Connect Repository

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link
\`\`\`

### 2. Configure Build Settings

The project uses a custom build command that clears caches:

\`\`\`json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install"
}
\`\`\`

This is already configured in `vercel.json`.

### 3. Set Environment Variables

\`\`\`bash
# Via CLI
vercel env add REMOTE_POSTGRES_URL
vercel env add SESSION_SECRET
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
vercel env add API_SIGNING_SECRET

# Or via Vercel Dashboard
# Settings > Environment Variables
\`\`\`

### 4. Deploy

\`\`\`bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
\`\`\`

## Build Configuration

### Custom Build Script

The `vercel-build` script:
1. Clears all Next.js and Turbopack caches
2. Validates critical files exist
3. Checks module exports
4. Runs standard Next.js build

\`\`\`json
{
  "scripts": {
    "vercel-build": "npm run clean:vercel && npm run build",
    "clean:vercel": "rm -rf .next .turbo node_modules/.cache"
  }
}
\`\`\`

### Build Optimization

Set in `vercel.json`:

\`\`\`json
{
  "env": {
    "NODE_ENV": "production",
    "NODE_PG_FORCE_NATIVE": "false",
    "npm_config_build_from_source": "false",
    "SKIP_OPTIONAL_DEPS": "true"
  }
}
\`\`\`

## Post-Deployment

### 1. Run Database Migrations

After first deployment, initialize the database:

\`\`\`bash
# Via Vercel CLI
vercel env pull .env.local
npm run db:migrate
\`\`\`

Or access the deployment URL and visit `/api/install/database/migrate`

### 2. Verify Deployment

Check these endpoints:
- `https://your-app.vercel.app` - Main app
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/install/database/status` - Database status

## Troubleshooting

### Build Fails with Module Not Found

**Problem**: Turbopack cache references old/deleted files

**Solution**: The build system automatically clears caches, but you can manually trigger:

\`\`\`bash
# Clear local caches
npm run clean

# Redeploy
vercel --prod --force
\`\`\`

### TypeScript Errors

**Problem**: Stale TypeScript build info

**Solution**: Already handled by prebuild script, but verify:

\`\`\`bash
# Locally
npm run type-check

# If errors persist
rm tsconfig.tsbuildinfo
npm run type-check
\`\`\`

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**: Verify environment variables:

\`\`\`bash
# Check vars are set
vercel env ls

# Pull and test locally
vercel env pull .env.local
npm run dev
\`\`\`

### Build Timeout

**Problem**: Build exceeds time limit

**Solution**: 
1. Optimize build by excluding unnecessary files
2. Use Vercel Pro for longer build times
3. Pre-build heavy dependencies

## Performance Optimization

### 1. Database Connection Pooling

Already configured in `lib/db.ts`:

\`\`\`typescript
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})
\`\`\`

### 2. API Route Optimization

Set runtime appropriately:

\`\`\`typescript
export const runtime = "nodejs" // For database operations
// or
export const runtime = "edge" // For simple API routes
\`\`\`

### 3. Image Optimization

Configured in `next.config.mjs`:

\`\`\`javascript
images: {
  unoptimized: true, // For external exchange images
}
\`\`\`

## Monitoring

### View Logs

\`\`\`bash
# Real-time logs
vercel logs your-deployment-url --follow

# Or via dashboard
# Deployments > [Your Deployment] > Logs
\`\`\`

### Set Up Alerts

1. Go to Vercel Dashboard
2. Settings > Notifications
3. Configure for:
   - Deployment failures
   - Build errors
   - Performance issues

## Continuous Deployment

### Automatic Deployments

Configured via Git integration:
- Push to `main` → Production deployment
- Push to `develop` → Preview deployment
- Pull requests → Preview deployments

### Manual Control

Disable auto-deployment:
1. Project Settings
2. Git > Deploy Hooks
3. Configure branch protection

## Rollback

If deployment fails:

\`\`\`bash
# Via CLI
vercel rollback

# Or via dashboard
# Deployments > [Previous Working] > Promote to Production
\`\`\`

## Support

For issues:
1. Check build logs: `vercel logs`
2. Review [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
3. Contact support: https://vercel.com/support
