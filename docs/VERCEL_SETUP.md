# Vercel Deployment Setup Guide

## PostgreSQL Database Configuration

The CTS v3.1 application is configured to use a remote PostgreSQL database on Vercel.

### Required Environment Variables

Add these environment variables to your Vercel project settings:

#### Database (Required)
\`\`\`
REMOTE_POSTGRES_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
\`\`\`

Or alternatively use:
\`\`\`
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
\`\`\`

#### Authentication (Required)
\`\`\`
SESSION_SECRET=<generate-a-random-32-character-string>
JWT_SECRET=<generate-a-random-32-character-string>
\`\`\`

#### Application (Recommended)
\`\`\`
NEXT_PUBLIC_APP_URL=https://v0-cts-v3-1.vercel.app
NODE_ENV=production
\`\`\`

### How to Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable above
4. Ensure variables are added to **Production**, **Preview**, and **Development** as needed
5. Redeploy your application

### Database Connection

The application automatically detects the database type:
- If `REMOTE_POSTGRES_URL` or `DATABASE_URL` is set → Uses PostgreSQL
- Otherwise → Falls back to SQLite (development only)

### Security Recommendations

⚠️ **Important:** The database credentials provided above should be treated as sensitive:

1. **Change database password regularly** - Update password in PostgreSQL
2. **Restrict IP access** - Ensure only Vercel deployment IPs can connect
3. **Enable SSL/TLS** - Use encrypted connections to the database
4. **Rotate secrets** - Periodically update `SESSION_SECRET` and `JWT_SECRET`
5. **Never commit to git** - These values should only be in Vercel environment variables

### Verification

After deployment, verify the database connection:
1. Check Vercel deployment logs for database initialization messages
2. Log in to the application
3. Navigate to Settings → Exchange to confirm data is persisting

### Troubleshooting

**"Database connection failed"**
- Verify `REMOTE_POSTGRES_URL` is correctly set in Vercel
- Check database server is accessible from Vercel (whitelist IPs if needed)
- Ensure credentials are correct

**"DATABASE_URL environment variable is required"**
- Add either `REMOTE_POSTGRES_URL` or `DATABASE_URL` to Vercel environment
- Redeploy after adding variables

**"Connection timeout"**
- Check database server status at 83.229.86.105:5432
- Verify network connectivity from Vercel to database server
- Check firewall rules and pg_hba.conf settings
