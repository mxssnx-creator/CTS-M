import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

function getLogLevel(): number {
  if (process.env.LOG_LEVEL === "debug") return LOG_LEVELS.DEBUG
  if (process.env.LOG_LEVEL === "warn") return LOG_LEVELS.WARN
  if (process.env.LOG_LEVEL === "error") return LOG_LEVELS.ERROR
  return process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const SKIP_PATHS = [
  "/_next",
  "/favicon.ico",
  "/api/health",
]

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname, search } = request.nextUrl

  // Skip logging for static assets and health checks
  if (SKIP_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get or create correlation ID
  const correlationId = request.headers.get("x-correlation-id") || generateCorrelationId()
  const traceId = request.headers.get("x-trace-id") || generateCorrelationId()

  // Log request start
  const logLevel = getLogLevel()
  if (logLevel <= LOG_LEVELS.DEBUG) {
    console.log(
      `[${correlationId}] ${request.method} ${pathname}${search}`,
      {
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
      }
    )
  }

  // Clone request headers and add correlation headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-correlation-id", correlationId)
  requestHeaders.set("x-trace-id", traceId)
  requestHeaders.set("x-request-start", startTime.toString())

  // Process request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add correlation headers to response
  response.headers.set("x-correlation-id", correlationId)
  response.headers.set("x-trace-id", traceId)

  // Calculate duration
  const duration = Date.now() - startTime

  // Log response
  if (logLevel <= LOG_LEVELS.INFO) {
    const status = response.status
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO"
    const emoji = status >= 500 ? "❌" : status >= 400 ? "⚠️" : "✓"

    console.log(
      `[${correlationId}] ${emoji} ${request.method} ${pathname} -> ${status} (${duration}ms)`
    )

    // Log slow requests
    if (duration > 1000) {
      console.warn(
        `[${correlationId}] ⏱️ SLOW REQUEST: ${request.method} ${pathname} took ${duration}ms`
      )
    }

    // Log errors with more detail
    if (status >= 500) {
      console.error(
        `[${correlationId}] SERVER ERROR: ${request.method} ${pathname} -> ${status}`,
        { duration, method: request.method, path: pathname }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
