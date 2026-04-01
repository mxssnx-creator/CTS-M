/**
 * Unified Logging Configuration
 * 
 * Central configuration for all logging systems in the application.
 * Controls log levels, retention, output destinations, and sampling.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogDestination {
  CONSOLE = 'console',
  REDIS = 'redis',
  FILE = 'file',
  EXTERNAL = 'external',
}

export interface LogConfig {
  /** Minimum log level to record */
  minLevel: LogLevel
  
  /** Destinations to send logs to */
  destinations: LogDestination[]
  
  /** Enable correlation ID tracking */
  enableCorrelationTracking: boolean
  
  /** Enable metrics collection */
  enableMetrics: boolean
  
  /** Enable console output with colors */
  enableConsoleColors: boolean
  
  /** Redis key prefix for log storage */
  redisKeyPrefix: string
  
  /** Maximum logs to keep in Redis per category */
  maxRedisLogsPerCategory: number
  
  /** Maximum logs to keep in Redis total */
  maxRedisLogsTotal: number
  
  /** TTL for Redis logs in seconds (default: 7 days) */
  redisTtlSeconds: number
  
  /** Maximum logs to keep in memory buffer */
  maxBufferLogs: number
  
  /** Enable log sampling for high-frequency events */
  enableSampling: boolean
  
  /** Sample rate (1 = log all, 0.1 = log 10%, etc.) */
  sampleRate: number
  
  /** Categories to always log (bypass sampling) */
  alwaysLogCategories: string[]
  
  /** Enable performance timing logs */
  enablePerformanceTiming: boolean
  
  /** Slow request threshold in ms */
  slowRequestThresholdMs: number
  
  /** Enable error alerts */
  enableErrorAlerts: boolean
  
  /** Environment-specific overrides */
  environmentOverrides: {
    development: Partial<LogConfig>
    production: Partial<LogConfig>
    test: Partial<LogConfig>
  }
}

/**
 * Default logging configuration
 */
export const defaultLogConfig: LogConfig = {
  minLevel: LogLevel.INFO,
  destinations: [LogDestination.CONSOLE, LogDestination.REDIS],
  enableCorrelationTracking: true,
  enableMetrics: true,
  enableConsoleColors: true,
  redisKeyPrefix: 'cts_logs',
  maxRedisLogsPerCategory: 5000,
  maxRedisLogsTotal: 10000,
  redisTtlSeconds: 604800, // 7 days
  maxBufferLogs: 10000,
  enableSampling: true,
  sampleRate: 1.0,
  alwaysLogCategories: ['error', 'critical', 'security', 'alert'],
  enablePerformanceTiming: true,
  slowRequestThresholdMs: 1000,
  enableErrorAlerts: true,
  environmentOverrides: {
    development: {
      minLevel: LogLevel.DEBUG,
      enableSampling: false,
      enableConsoleColors: true,
      destinations: [LogDestination.CONSOLE],
    },
    production: {
      minLevel: LogLevel.INFO,
      enableSampling: true,
      sampleRate: 0.5,
      enableConsoleColors: false,
      destinations: [LogDestination.CONSOLE, LogDestination.REDIS],
    },
    test: {
      minLevel: LogLevel.ERROR,
      enableSampling: false,
      destinations: [],
    },
  },
}

/**
 * Get the effective configuration for the current environment
 */
export function getLogConfig(overrides?: Partial<LogConfig>): LogConfig {
  const env = process.env.NODE_ENV || 'development'
  const envOverride = defaultLogConfig.environmentOverrides[env as keyof typeof defaultLogConfig.environmentOverrides] || {}
  
  return {
    ...defaultLogConfig,
    ...envOverride,
    ...overrides,
  }
}

/**
 * Get log level from environment variable or default
 */
export function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase()
  
  switch (envLevel) {
    case 'debug':
      return LogLevel.DEBUG
    case 'info':
      return LogLevel.INFO
    case 'warn':
    case 'warning':
      return LogLevel.WARN
    case 'error':
      return LogLevel.ERROR
    case 'critical':
      return LogLevel.CRITICAL
    default:
      return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }
}

/**
 * Check if a log level should be recorded based on minimum level
 */
export function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  const levelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.CRITICAL]: 4,
  }
  
  return levelOrder[level] >= levelOrder[minLevel]
}

/**
 * Format a log entry for console output
 */
export function formatConsoleLog(options: {
  level: LogLevel
  category: string
  message: string
  correlationId?: string
  context?: Record<string, any>
  enableColors?: boolean
}): string {
  const { level, category, message, correlationId, context, enableColors = true } = options
  
  const colors = enableColors ? {
    [LogLevel.DEBUG]: '\x1b[36m',
    [LogLevel.INFO]: '\x1b[32m',
    [LogLevel.WARN]: '\x1b[33m',
    [LogLevel.ERROR]: '\x1b[31m',
    [LogLevel.CRITICAL]: '\x1b[35m',
    reset: '\x1b[0m',
  } : {
    [LogLevel.DEBUG]: '',
    [LogLevel.INFO]: '',
    [LogLevel.WARN]: '',
    [LogLevel.ERROR]: '',
    [LogLevel.CRITICAL]: '',
    reset: '',
  }
  
  const timestamp = new Date().toISOString()
  const levelStr = level.toUpperCase().padEnd(8)
  const corrStr = correlationId ? `[${correlationId}] ` : ''
  const ctxStr = context ? ` ${JSON.stringify(context)}` : ''
  
  return `${colors[level]}[${timestamp}] [${levelStr}] [${category}] ${colors.reset}${corrStr}${message}${ctxStr}`
}
