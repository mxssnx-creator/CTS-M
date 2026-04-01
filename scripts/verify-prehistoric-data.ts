#!/usr/bin/env node

/**
 * Prehistoric Data Verification Script
 * Verifies that all symbols have complete historical data across all timeframes
 */

import { getRedisClient, initRedis } from '@/lib/redis-db'

interface DataCheckResult {
  symbol: string
  timeframe: string
  pointCount: number
  oldestPoint?: string
  newestPoint?: string
  status: 'OK' | 'WARNING' | 'ERROR'
  message: string
}

interface SummaryStats {
  totalSymbols: number
  totalTimeframes: number
  totalDataPoints: number
  completeSymbols: number
  incompleteSymbols: number
  missingTimeframes: Map<string, string[]>
  averagePointsPerSymbol: number
}

const REQUIRED_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']
const MIN_POINTS_PER_TIMEFRAME: Record<string, number> = {
  '1m': 1440, // 1 day of minutes
  '5m': 288, // 1 day of 5-min candles
  '15m': 96, // 1 day of 15-min candles
  '1h': 24, // 1 day of hourly candles
  '4h': 6, // 1 day of 4-hour candles
  '1d': 1, // At least 1 day
}

async function verifyPrehistoricData(): Promise<void> {
  console.log('\n📊 Prehistoric Data Verification\n')
  console.log('═════════════════════════════════════════\n')

  try {
    await initRedis()
    const client = getRedisClient()

    console.log('🔍 Scanning market data...\n')

    // Get all market data keys
    const keys = await client.keys('market_data:*')
    const results: DataCheckResult[] = []
    const symbolTimeframeMap = new Map<string, Set<string>>()

    console.log(`Found ${keys.length} market data entries\n`)

    // Process each market data entry
    for (const key of keys) {
      const parts = key.split(':')
      if (parts.length < 3) continue

      const symbol = parts[1]
      const timeframe = parts[2]

      // Get data for this symbol/timeframe
      const data = await client.get(key)
      let pointCount = 0
      let oldestPoint: string | undefined
      let newestPoint: string | undefined
      let status: 'OK' | 'WARNING' | 'ERROR' = 'OK'
      let message = ''

      try {
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            pointCount = parsed.length
            if (parsed.length > 0) {
              oldestPoint = parsed[0]?.timestamp
              newestPoint = parsed[parsed.length - 1]?.timestamp
            }

            const minRequired = MIN_POINTS_PER_TIMEFRAME[timeframe] || 0
            if (pointCount < minRequired) {
              status = 'WARNING'
              message = `Only ${pointCount} points (need ${minRequired})`
            } else {
              message = `${pointCount} data points loaded`
            }
          } else {
            status = 'ERROR'
            message = 'Invalid data format (not an array)'
          }
        } else {
          status = 'ERROR'
          message = 'No data found'
          pointCount = 0
        }
      } catch (error) {
        status = 'ERROR'
        message = `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`
      }

      results.push({
        symbol,
        timeframe,
        pointCount,
        oldestPoint,
        newestPoint,
        status,
        message,
      })

      // Track symbol->timeframes
      if (!symbolTimeframeMap.has(symbol)) {
        symbolTimeframeMap.set(symbol, new Set())
      }
      symbolTimeframeMap.get(symbol)!.add(timeframe)
    }

    // Print results by symbol
    console.log('📈 Data Points by Symbol & Timeframe\n')
    console.log('Symbol      │ 1m     │ 5m     │ 15m    │ 1h     │ 4h     │ 1d')
    console.log('─────────────┼────────┼────────┼────────┼────────┼────────┼─────')

    const symbolResults = new Map<string, DataCheckResult[]>()
    results.forEach((r) => {
      if (!symbolResults.has(r.symbol)) {
        symbolResults.set(r.symbol, [])
      }
      symbolResults.get(r.symbol)!.push(r)
    })

    symbolResults.forEach((symbolData, symbol) => {
      const row = [symbol.padEnd(11)]

      REQUIRED_TIMEFRAMES.forEach((tf) => {
        const data = symbolData.find((r) => r.timeframe === tf)
        if (data) {
          const statusIcon = data.status === 'OK' ? '✓' : data.status === 'WARNING' ? '⚠' : '✗'
          row.push(`${statusIcon} ${data.pointCount}`.padEnd(6))
        } else {
          row.push('✗ 0   '.padEnd(6))
        }
      })

      console.log(row.join('│'))
    })

    // Calculate summary statistics
    console.log('\n\n📊 Summary Statistics\n')
    console.log('─────────────────────────────────────────')

    const stats: SummaryStats = {
      totalSymbols: symbolResults.size,
      totalTimeframes: REQUIRED_TIMEFRAMES.length,
      totalDataPoints: results.reduce((sum, r) => sum + r.pointCount, 0),
      completeSymbols: 0,
      incompleteSymbols: 0,
      missingTimeframes: new Map(),
      averagePointsPerSymbol: 0,
    }

    symbolResults.forEach((symbolData, symbol) => {
      const hasAllTimeframes = REQUIRED_TIMEFRAMES.every((tf) =>
        symbolData.some((r) => r.timeframe === tf && r.status === 'OK'),
      )

      if (hasAllTimeframes) {
        stats.completeSymbols += 1
      } else {
        stats.incompleteSymbols += 1
        const missing: string[] = []
        REQUIRED_TIMEFRAMES.forEach((tf) => {
          const data = symbolData.find((r) => r.timeframe === tf)
          if (!data || data.status !== 'OK') {
            missing.push(tf)
          }
        })
        stats.missingTimeframes.set(symbol, missing)
      }
    })

    stats.averagePointsPerSymbol = stats.totalDataPoints / stats.totalSymbols

    console.log(`Total Symbols:              ${stats.totalSymbols}`)
    console.log(`Complete Symbols:           ${stats.completeSymbols} (${((stats.completeSymbols / stats.totalSymbols) * 100).toFixed(1)}%)`)
    console.log(`Incomplete Symbols:         ${stats.incompleteSymbols}`)
    console.log(`Total Data Points:          ${stats.totalDataPoints.toLocaleString()}`)
    console.log(`Average Points/Symbol:      ${stats.averagePointsPerSymbol.toFixed(0)}`)

    // Print incomplete symbols
    if (stats.incompleteSymbols > 0) {
      console.log('\n\n⚠️  Incomplete Symbols\n')
      console.log('─────────────────────────────────────────')

      stats.missingTimeframes.forEach((missing, symbol) => {
        console.log(`${symbol}: missing ${missing.join(', ')}`)
      })
    }

    // Print detailed issues
    const errorResults = results.filter((r) => r.status !== 'OK')
    if (errorResults.length > 0) {
      console.log('\n\n❌ Data Issues\n')
      console.log('─────────────────────────────────────────')

      errorResults.slice(0, 20).forEach((r) => {
        console.log(`${r.symbol} ${r.timeframe}: ${r.message}`)
      })

      if (errorResults.length > 20) {
        console.log(`... and ${errorResults.length - 20} more issues`)
      }
    }

    // Overall assessment
    console.log('\n\n🎯 Overall Assessment\n')
    console.log('─────────────────────────────────────────')

    if (stats.completeSymbols === stats.totalSymbols) {
      console.log('✅ All symbols have complete prehistoric data')
      console.log('System is ready for production trading')
    } else {
      const completeness = (stats.completeSymbols / stats.totalSymbols) * 100
      console.log(`⚠️  ${completeness.toFixed(1)}% of symbols have complete data`)
      console.log(`${stats.incompleteSymbols} symbols need data loading`)
    }

    // Performance estimate
    console.log('\n\n⏱️  Processing Capacity Estimate\n')
    console.log('─────────────────────────────────────────')

    const avgTimeframeSize = results
      .filter((r) => r.timeframe === '1h')
      .reduce((sum, r) => sum + r.pointCount, 0) / stats.totalSymbols
    const estimatedProcessingTime = (stats.totalDataPoints * 0.001) / 1000 // 1ms per 1k points, in seconds

    console.log(`Average points per symbol:  ${avgTimeframeSize.toFixed(0)} (1h timeframe)`)
    console.log(`Estimated processing time:  ${estimatedProcessingTime.toFixed(1)} seconds`)
    console.log(`Processing load per cycle:  ${(stats.totalDataPoints / stats.totalSymbols / 100).toFixed(1)}% (at 100 items/cycle)`)

    console.log('\n✅ Verification Complete!\n')

    process.exit(stats.completeSymbols === stats.totalSymbols ? 0 : 1)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

verifyPrehistoricData()
