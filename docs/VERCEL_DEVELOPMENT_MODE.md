# Vercel Development Mode Setup

This project is now configured to run in **development mode** on Vercel for better error reporting and debugging.

## What Changed

1. **NODE_ENV set to "development"** - Enables detailed error messages and stack traces
2. **React Strict Mode enabled** - Helps identify potential problems in the application
3. **Enhanced logging** - Full URL logging for fetch requests to debug API calls
4. **Source maps preserved** - Better error tracking with original source code references

## Benefits of Development Mode

- **Detailed Error Messages** - See full error stack traces instead of generic "Internal Server Error"
- **Better Debugging** - Console logs and debug statements are visible
- **Source Maps** - Errors show exact file and line numbers from your source code
- **React DevTools Compatible** - Better integration with browser development tools

## Environment Variables Required

Make sure these are set in your Vercel project settings:

\`\`\`env
NODE_ENV=development
REMOTE_POSTGRES_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NEXT_PUBLIC_APP_URL=https://v0-cts-v3-1.vercel.app
\`\`\`

## How to Submit Errors

With development mode enabled, you'll see:

1. **Full error stack traces** in the browser console
2. **API error details** in network tab responses
3. **Server logs** in Vercel deployment logs
4. **Component error boundaries** showing which component failed

### To Report Issues:

1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Check Network tab for failed API requests
4. Copy the full error message including stack trace
5. Take screenshots of the error
6. Check Vercel deployment logs for server-side errors

## Switching to Production Mode

When ready for production, set `NODE_ENV=production` in your Vercel environment variables and redeploy.

## Important Notes

- Development mode has slightly slower performance due to additional checks
- Error messages may expose internal application structure (don't use in production with real users)
- Source maps increase bundle size slightly
- This setup is ideal for testing and debugging on the live deployment
