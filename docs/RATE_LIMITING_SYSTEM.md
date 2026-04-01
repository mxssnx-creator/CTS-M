# Systemwide Rate Limiting System

## Overview

The rate limiting system prevents abuse of connection request endpoints by enforcing request quotas per connection across a sliding time window. It uses Redis for distributed, serverless-compatible rate limiting.

## Architecture

### Rate Limiter Types

1. **testConnectionLimiter** - 10 test requests per minute
   - Used by: `/api/settings/connections/[id]/test`
   - Purpose: Prevent excessive connection testing

2. **toggleConnectionLimiter** - 30 toggle requests per minute
   - Used by: `/api/settings/connections/[id]/toggle-dashboard`
   - Purpose: Prevent rapid enable/disable spam

3. **fetchDataLimiter** - 20 fetch requests per minute
   - Used by: Data retrieval endpoints
   - Purpose: Limit market data fetching

4. **generalLimiter** - 60 general requests per minute
   - Used by: All connection-related endpoints
   - Purpose: Global fallback rate limiting

### Redis-Based Implementation

```typescript
// Example: Check if request is allowed
const limitResult = await testConnectionLimiter.checkLimit(connectionId)

if (!limitResult.allowed) {
  return NextResponse.json(
    { error: "Rate limit exceeded", retryAfter: limitResult.retryAfter },
    { status: 429, headers: { "Retry-After": String(limitResult.retryAfter) } }
  )
}
```

### Rate Limit Result Structure

```typescript
interface RateLimitResult {
  allowed: boolean          // Whether the request should be allowed
  remaining: number         // Requests remaining in current window
  resetTime: number        // Epoch timestamp when window resets
  retryAfter?: number      // Seconds to wait before retrying (only if !allowed)
}
```

## Usage

### In API Routes

```typescript
import { testConnectionLimiter } from "@/lib/connection-rate-limiter"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Check rate limit
  const limitResult = await testConnectionLimiter.checkLimit(id)
  
  if (!limitResult.allowed) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        retryAfter: limitResult.retryAfter 
      },
      { status: 429, headers: { "Retry-After": String(limitResult.retryAfter) } }
    )
  }
  
  // Process request...
}
```

### Getting Status

```typescript
const status = await testConnectionLimiter.getStatus(connectionId)
console.log(`Remaining requests: ${status?.remaining}`)
console.log(`Reset time: ${new Date(status?.resetTime)}`)
```

### Resetting Limits (Admin)

```typescript
await testConnectionLimiter.resetLimit(connectionId)
```

## HTTP Headers

Responses include standard rate limit headers:

```
X-RateLimit-Limit: 10              # Total requests allowed per window
X-RateLimit-Remaining: 7           # Remaining requests in current window
X-RateLimit-Reset: 1704067200      # Unix timestamp of window reset
Retry-After: 45                    # Seconds to wait (only on 429 response)
```

## Configuration

Rate limiters are configured in `/lib/connection-rate-limiter.ts`:

```typescript
export const testConnectionLimiter = new ConnectionRateLimiter({
  windowMs: 60 * 1000,    // 1 minute window
  maxRequests: 10,        // 10 requests per window
  keyPrefix: "rate_limit:test:",
})
```

To adjust limits, modify the configuration:

```typescript
// Increase to 20 tests per minute
new ConnectionRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: "rate_limit:test:",
})
```

## Error Responses

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum 10 tests per minute. Retry after 45 seconds.",
  "retryAfter": 45,
  "resetTime": 1704067245000
}
```

## Systemwide Behavior

- **Per-connection limits**: Each connection ID has independent rate limits
- **Redis-backed**: Survives server restarts and scales across multiple instances
- **Graceful degradation**: If Redis is unavailable, requests are allowed (fail open)
- **Automatic cleanup**: Rate limit records expire from Redis after window duration

## Best Practices

1. **Check limits before expensive operations**
   ```typescript
   const limit = await testConnectionLimiter.checkLimit(id)
   if (!limit.allowed) return error // Fail fast
   ```

2. **Respect Retry-After headers in client code**
   - Client should wait at least the number of seconds specified

3. **Monitor rate limit hits**
   - Log when rate limits are triggered
   - Alert on spike in 429 responses

4. **Adjust limits based on usage**
   - Monitor `/api/monitoring/rate-limits` for patterns
   - Increase limits for high-volume operations
   - Decrease limits to prevent abuse

## Implementation Details

### Sliding Window Counter

The system uses a sliding window counter approach:

1. Check if current window has expired
2. If expired, start new window with count=1
3. If not expired, increment counter
4. Compare counter against maxRequests
5. Return result with remaining requests and reset time

### Key Format

Redis keys use the pattern: `{keyPrefix}{connectionId}:{field}`

Example: `rate_limit:test:bybit-x03:window` and `rate_limit:test:bybit-x03:count`

### TTL Management

- Window keys expire after windowMs (prevents memory leak)
- Count keys expire after windowMs (stays in sync with window)
- Automatic cleanup after window expiration

## Monitoring Endpoint

To be added: `/api/monitoring/rate-limits` - View current rate limit status for all connections

```json
GET /api/monitoring/rate-limits?connectionId=bybit-x03

{
  "connectionId": "bybit-x03",
  "limiters": {
    "test": { "allowed": true, "remaining": 8, "resetTime": 1704067245000 },
    "toggle": { "allowed": true, "remaining": 28, "resetTime": 1704067245000 },
    "fetch": { "allowed": true, "remaining": 19, "resetTime": 1704067245000 }
  }
}
```

## Troubleshooting

### "Rate limit exceeded" on first request
- Usually temporary after restart
- Wait 1 minute for window to reset
- Or contact admin to reset limits

### Different rate limits across servers
- Indicates Redis connection issue
- Verify Redis connectivity
- Check Redis key expiration settings

### All requests returning 429
- Rate limit misconfigured
- Check ConnectionRateLimiter config
- Verify Redis is running and accessible
