/**
 * Market Data Loader
 * Populates Redis with REAL OHLCV data from exchanges for trading engine
 * 
 * KEY ARCHITECTURE:
 *   market_data:{symbol}:1m       → JSON string, full MarketData object with 250 candles (used by engine loader)
 *   market_data:{symbol}:candles  → JSON string, raw candles array (used by indication processor for history)
 *   market_data:{symbol}          → Redis hash, single latest candle (used by getMarketData() in redis-db)
 */

import { getClient, initRedis, getAllConnections } from "@/lib/redis-db"
import { logProgressionEvent } from "@/lib/engine-progression-logs"

export interface MarketDataCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketData {
  symbol: string
  timeframe: string // "1m", "5m", "15m", "1h", "4h", "1d"
  candles: MarketDataCandle[]
  lastUpdated: string
  source: string // Exchange name or "synthetic"
}

/**
 * Generate synthetic market data as fallback
 * Only used when exchange fetch fails
 */
export function generateSyntheticCandles(
  symbol: string,
  basePrice: number,
  candleCount: number = 100
): MarketDataCandle[] {
  const candles: MarketDataCandle[] = []
  const now = Date.now()
  const candleInterval = 60000 // 1 minute in ms

  let lastClose = basePrice

  for (let i = candleCount; i > 0; i--) {
    const timestamp = now - i * candleInterval

    // Generate realistic price movement (±0.5% per candle)
    const change = (Math.random() - 0.5) * lastClose * 0.01
    const open = lastClose
    const close = Math.max(lastClose * 0.8, lastClose + change) // Prevent crashes
    const high = Math.max(open, close) * (1 + Math.random() * 0.005)
    const low = Math.min(open, close) * (1 - Math.random() * 0.005)
    const volume = Math.random() * 1000000

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    })

    lastClose = close
  }

  return candles
}

/**
 * Aggregate 1-second candles into 1-minute candles
 */
export function aggregateCandlesTo1m(candles1s: MarketDataCandle[]): MarketDataCandle[] {
  const candles1m: MarketDataCandle[] = []
  const minuteGroups = new Map<number, MarketDataCandle[]>()

  // Group 1s candles by minute
  for (const candle of candles1s) {
    const minuteTimestamp = Math.floor(candle.timestamp / 60000) * 60000
    if (!minuteGroups.has(minuteTimestamp)) {
      minuteGroups.set(minuteTimestamp, [])
    }
    minuteGroups.get(minuteTimestamp)!.push(candle)
  }

  // Aggregate each minute
  for (const [timestamp, minuteCandles] of minuteGroups) {
    const open = minuteCandles[0].open
    const close = minuteCandles[minuteCandles.length - 1].close
    const high = Math.max(...minuteCandles.map(c => c.high))
    const low = Math.min(...minuteCandles.map(c => c.low))
    const volume = minuteCandles.reduce((sum, c) => sum + c.volume, 0)

    candles1m.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    })
  }

  return candles1m.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Interpolate 1-minute candles into 1-second candles (for fallback)
 */
export function interpolateCandlesTo1s(candles1m: MarketDataCandle[]): MarketDataCandle[] {
  const candles1s: MarketDataCandle[] = []

  for (const candle1m of candles1m) {
    // Create 60 candles for each minute (simple interpolation)
    for (let i = 0; i < 60; i++) {
      const timestamp = candle1m.timestamp + i * 1000
      // Linear interpolation between open and close
      const progress = i / 59
      const price = candle1m.open + (candle1m.close - candle1m.open) * progress
      // Add some noise
      const noise = (Math.random() - 0.5) * price * 0.001
      const finalPrice = price + noise

      candles1s.push({
        timestamp,
        open: finalPrice,
        high: Math.max(finalPrice, candle1m.high * (0.999 + Math.random() * 0.002)),
        low: Math.min(finalPrice, candle1m.low * (0.998 + Math.random() * 0.004)),
        close: finalPrice,
        volume: candle1m.volume / 60, // Distribute volume evenly
      })
    }
  }

  return candles1s
}

/**
 * Fetch large amounts of historical OHLCV data with pagination
 * Tries all available exchange connections in order of preference
 */
async function fetchHistoricalMarketData(
  symbol: string,
  timeframe = "1m",
  daysBack = 30
): Promise<{ candles: MarketDataCandle[]; source: string } | null> {
  try {
    // Get all connections with credentials
    const connections = await getAllConnections()
    const validConnections = connections.filter((c: any) => {
      const hasCredentials = (c.api_key || c.apiKey) && (c.api_secret || c.apiSecret)
      const hasValidCredentials = hasCredentials &&
        (c.api_key || c.apiKey || "").length > 5 &&
        (c.api_secret || c.apiSecret || "").length > 5
      return hasValidCredentials && c.is_enabled_dashboard === "1" // Only enabled connections
    })

    if (validConnections.length === 0) {
      console.log(`[v0] [MarketData] No valid exchange connections for historical data fetch`)
      return null
    }

    // Try exchanges in order of preference: BingX, Binance, Bybit, OKX, Pionex, OrangeX
    const exchangePriority = ["bingx", "binance", "bybit", "okx", "pionex", "orangex"]
    let prioritizedConnections = validConnections.sort((a, b) => {
      const aIndex = exchangePriority.indexOf(a.exchange.toLowerCase())
      const bIndex = exchangePriority.indexOf(b.exchange.toLowerCase())
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

    // If no valid connections found, try to inject predefined credentials for base connections
    if (prioritizedConnections.length === 0) {
      console.log(`[v0] [MarketData] No valid connections found, attempting to inject predefined credentials...`)

      try {
        const { BASE_CONNECTION_CREDENTIALS } = await import("@/lib/base-connection-credentials")
        const client = getClient()

        // Try to inject credentials for base connections
        const baseConnections = ["bingx-x01", "bybit-x03", "pionex-x01", "orangex-x01"]
        for (const connId of baseConnections) {
          if (BASE_CONNECTION_CREDENTIALS[connId as keyof typeof BASE_CONNECTION_CREDENTIALS]) {
            const { apiKey, apiSecret } = BASE_CONNECTION_CREDENTIALS[connId as keyof typeof BASE_CONNECTION_CREDENTIALS]
            if (apiKey && apiSecret && apiKey.length > 10 && apiSecret.length > 10) {
              await client.hset(`connection:${connId}`, {
                api_key: apiKey,
                api_secret: apiSecret,
                is_enabled_dashboard: "1",
                is_enabled: "1",
                exchange: connId.split('-')[0],
                name: `${connId.split('-')[0].toUpperCase()} Base Connection`,
                updated_at: new Date().toISOString(),
              })
              console.log(`[v0] [MarketData] Injected predefined credentials for ${connId}`)
            }
          }
        }

        // Re-fetch connections after credential injection
        const updatedConnections = await getAllConnections()
        const updatedValidConnections = updatedConnections.filter((c: any) => {
          const hasCredentials = (c.api_key || c.apiKey) && (c.api_secret || c.apiSecret)
          const hasValidCredentials = hasCredentials &&
            (c.api_key || c.apiKey || "").length > 5 &&
            (c.api_secret || c.apiSecret || "").length > 5
          return hasValidCredentials
        })

        prioritizedConnections = updatedValidConnections.sort((a, b) => {
          const aIndex = exchangePriority.indexOf(a.exchange.toLowerCase())
          const bIndex = exchangePriority.indexOf(b.exchange.toLowerCase())
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
        })

        if (prioritizedConnections.length > 0) {
          console.log(`[v0] [MarketData] ✓ Successfully injected credentials, now have ${prioritizedConnections.length} valid connections`)
        }
      } catch (error) {
        console.warn(`[v0] [MarketData] Failed to inject predefined credentials:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log(`[v0] [MarketData] Trying ${prioritizedConnections.length} exchanges for ${symbol} historical data: ${prioritizedConnections.map(c => c.exchange).join(", ")}`)

    for (const conn of prioritizedConnections) {
      try {
        console.log(`[v0] [MarketData] Attempting to fetch ${daysBack} days of ${timeframe} data for ${symbol} from ${conn.exchange}`)

        await logProgressionEvent("market-data-loader", "market_data_exchange_attempt", "info", `Attempting to fetch data from ${conn.exchange}`, {
          exchange: conn.exchange,
          symbol,
          timeframe,
          daysBack,
        })

        const { createExchangeConnector } = await import("@/lib/exchange-connectors")
        const connector = await createExchangeConnector(
          conn.exchange,
          {
            apiKey: conn.api_key || conn.apiKey || "",
            apiSecret: conn.api_secret || conn.apiSecret || "",
            apiPassphrase: conn.api_passphrase || conn.apiPassphrase || "",
            apiType: (conn.api_type || "perpetual_futures") as "spot" | "perpetual_futures" | "unified",
            isTestnet: conn.is_testnet === "1" || conn.is_testnet === true,
          }
        )

        const endTime = Date.now()
        const startTime = endTime - (daysBack * 24 * 60 * 60 * 1000)
        const allCandles: MarketDataCandle[] = []

        // Determine chunk size based on exchange
        const chunkSizes: Record<string, number> = {
          "bingx": 1000,
          "binance": 1000,
          "bybit": 1000,
          "okx": 300,
          "pionex": 1000,
          "orangex": 1000,
        }
        const chunkSize = chunkSizes[conn.exchange.toLowerCase()] || 500

        let currentStartTime = startTime
        let chunksFetched = 0
        let consecutiveFailures = 0
        const maxConsecutiveFailures = 3

        while (currentStartTime < endTime && chunksFetched < 50 && consecutiveFailures < maxConsecutiveFailures) { // Limit to 50 chunks to prevent infinite loops
          const chunkEndTime = Math.min(currentStartTime + (chunkSize * getTimeframeMs(timeframe)), endTime)

          let candles: MarketDataCandle[] | null = null
          let retryCount = 0
          const maxRetries = 3

          // Retry logic with exponential backoff
          while (retryCount <= maxRetries && !candles) {
            try {
              candles = await connector.getOHLCV(symbol, timeframe, chunkSize, currentStartTime, chunkEndTime)
              if (candles && candles.length > 0) {
                break // Success, exit retry loop
              }
            } catch (error) {
              console.warn(`[v0] [MarketData] ${conn.exchange}: Chunk fetch failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : String(error))
              if (retryCount < maxRetries) {
                const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
                console.log(`[v0] [MarketData] ${conn.exchange}: Retrying in ${backoffMs}ms...`)
                await new Promise(resolve => setTimeout(resolve, backoffMs))
              }
            }
            retryCount++
          }

          if (candles && candles.length > 0) {
            allCandles.push(...candles)
            chunksFetched++
            consecutiveFailures = 0 // Reset failure counter
            console.log(`[v0] [MarketData] ${conn.exchange}: ✓ Fetched ${candles.length} candles (chunk ${chunksFetched}, total: ${allCandles.length})`)

            await logProgressionEvent("market-data-loader", "market_data_chunk_success", "info", `Fetched chunk ${chunksFetched} from ${conn.exchange}`, {
              exchange: conn.exchange,
              chunkNumber: chunksFetched,
              candlesInChunk: candles.length,
              totalCandles: allCandles.length,
              timeframe,
            })

            // Move to next chunk
            if (candles.length < chunkSize) {
              // No more data available
              break
            }
            currentStartTime = candles[candles.length - 1].timestamp + getTimeframeMs(timeframe)
          } else {
            consecutiveFailures++
            console.log(`[v0] [MarketData] ${conn.exchange}: No data received for chunk (consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures})`)

            await logProgressionEvent("market-data-loader", "market_data_chunk_failure", "warning", `Chunk ${chunksFetched + 1} failed from ${conn.exchange}`, {
              exchange: conn.exchange,
              chunkNumber: chunksFetched + 1,
              consecutiveFailures,
              maxConsecutiveFailures,
              timeframe,
            })

            if (consecutiveFailures >= maxConsecutiveFailures) {
              console.log(`[v0] [MarketData] ${conn.exchange}: Too many consecutive failures, stopping fetch`)

              await logProgressionEvent("market-data-loader", "market_data_exchange_failed", "error", `Exchange ${conn.exchange} failed after ${consecutiveFailures} consecutive failures`, {
                exchange: conn.exchange,
                consecutiveFailures,
                timeframe,
                daysBack,
              })

              break
            }
            // Move to next chunk even on failure to avoid getting stuck
            currentStartTime = chunkEndTime
          }

          // Rate limiting between chunks
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        if (allCandles.length > 0) {
          // Sort candles by timestamp to ensure chronological order
          allCandles.sort((a, b) => a.timestamp - b.timestamp)
          console.log(`[v0] [MarketData] ✓ Successfully fetched ${allCandles.length} total historical candles from ${conn.exchange}`)

          await logProgressionEvent("market-data-loader", "market_data_exchange_success", "info", `Successfully fetched ${allCandles.length} candles from ${conn.exchange}`, {
            exchange: conn.exchange,
            symbol,
            candlesCount: allCandles.length,
            timeframe,
            daysBack,
          })

          return { candles: allCandles, source: conn.exchange }
        } else {
          console.log(`[v0] [MarketData] No exchanges were able to provide historical data for ${symbol}`)

          await logProgressionEvent("market-data-loader", "market_data_all_exchanges_failed", "error", `All exchanges failed to provide historical data for ${symbol}`, {
            symbol,
            timeframe,
            daysBack,
            exchangesAttempted: prioritizedConnections.map(c => c.exchange),
          })

          return null
        }
      } catch (error) {
        console.warn(`[v0] [MarketData] Failed to fetch from ${conn.exchange}:`, error instanceof Error ? error.message : String(error))

        await logProgressionEvent("market-data-loader", "market_data_exchange_error", "error", `Failed to fetch from ${conn.exchange}: ${error instanceof Error ? error.message : String(error)}`, {
          exchange: conn.exchange,
          symbol,
          timeframe,
          daysBack,
          error: error instanceof Error ? error.message : String(error),
        })

        continue // Try next exchange
      }
    }

    console.log(`[v0] [MarketData] No exchanges were able to provide historical data for ${symbol}`)
    return null
  } catch (error) {
    console.error("[v0] [MarketData] Error fetching historical market data:", error)
    return null
  }
}

/**
 * Get milliseconds for a timeframe
 */
function getTimeframeMs(timeframe: string): number {
  const multipliers: Record<string, number> = {
    "1s": 1000,
    "5s": 5000,
    "15s": 15000,
    "30s": 30000,
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "30m": 1800000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
    "1w": 604800000,
    "1M": 2592000000,
  }
  return multipliers[timeframe] || 60000
}

/**
 * Fetch real OHLCV data from exchange
 * Uses the first available connection with valid credentials
 */
async function fetchRealMarketData(
  symbol: string,
  timeframe = "1m",
  limit = 250
): Promise<{ candles: MarketDataCandle[]; source: string } | null> {
  try {
    // Get all connections with credentials
    const connections = await getAllConnections()
    const validConnections = connections.filter((c: any) => {
      const hasCredentials = (c.api_key || c.apiKey) && (c.api_secret || c.apiSecret)
      const hasValidCredentials = hasCredentials && 
        (c.api_key || c.apiKey || "").length > 5 && 
        (c.api_secret || c.apiSecret || "").length > 5
      return hasValidCredentials
    })

    if (validConnections.length === 0) {
      console.log(`[v0] [MarketData] No valid connections for fetching real data`)
      return null
    }

    // Try each connection until we get data
    for (const conn of validConnections) {
      try {
        const { createExchangeConnector } = await import("@/lib/exchange-connectors")
        const connector = await createExchangeConnector(
          conn.exchange,
          {
            apiKey: conn.api_key || conn.apiKey || "",
            apiSecret: conn.api_secret || conn.apiSecret || "",
            apiType: (conn.api_type || "perpetual_futures") as "spot" | "perpetual_futures" | "unified",
            isTestnet: conn.is_testnet === "1" || conn.is_testnet === true,
          }
        )

        console.log(`[v0] [MarketData] Fetching ${symbol} from ${conn.exchange} (${conn.name})...`)
        
        const candles = await connector.getOHLCV(symbol, timeframe, limit)
        
        if (candles && candles.length > 0) {
          console.log(`[v0] [MarketData] ✓ Fetched ${candles.length} real candles from ${conn.exchange}`)
          return { candles, source: conn.exchange }
        }
      } catch (err) {
        console.warn(`[v0] [MarketData] Failed to fetch from ${conn.exchange}:`, err)
        continue
      }
    }

    return null
  } catch (error) {
    console.error("[v0] [MarketData] Error fetching real market data:", error)
    return null
  }
}

/**
 * Load market data for all symbols into Redis
 * Fetches REAL data from exchanges, falls back to synthetic only on failure
 */
export async function loadMarketDataForEngine(symbols: string[] = []): Promise<number> {
  try {
    await initRedis()
    const client = getClient()

    // Default symbols if none provided
    const targetSymbols = symbols.length > 0 ? symbols : [
      "BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT",
      "DOGEUSDT", "LINKUSDT", "LITUSDT", "THETAUSDT", "AVAXUSDT",
      "MATICUSDT", "SOLUSDT", "UNIUSDT", "APTUSDT", "ARBUSDT"
    ]

    // Base prices for fallback synthetic data
    const basePrices: Record<string, number> = {
      BTCUSDT: 45000, ETHUSDT: 2500, BNBUSDT: 600, XRPUSDT: 0.5,
      ADAUSDT: 0.8, DOGEUSDT: 0.12, LINKUSDT: 25, LITUSDT: 120,
      THETAUSDT: 2.5, AVAXUSDT: 35, MATICUSDT: 1.2, SOLUSDT: 140,
      UNIUSDT: 15, APTUSDT: 10, ARBUSDT: 1.8,
    }

    let loaded = 0
    let realDataCount = 0
    let syntheticCount = 0

    console.log(`[v0] [MarketData] Loading market data for ${targetSymbols.length} symbols...`)
    console.log(`[v0] [MarketData] Will try to fetch REAL historical data from exchanges first...`)

    await logProgressionEvent("market-data-loader", "market_data_load_start", "info", `Starting market data load for ${targetSymbols.length} symbols`, {
      symbols: targetSymbols,
      symbolsCount: targetSymbols.length,
    })

    let processedSymbols = 0
    for (const symbol of targetSymbols) {
      const progressPercent = Math.round((processedSymbols / targetSymbols.length) * 100)
      console.log(`[v0] [MarketData] Processing ${symbol} (${processedSymbols + 1}/${targetSymbols.length}, ${progressPercent}%)`)

      await logProgressionEvent("market-data-loader", "market_data_symbol_start", "info", `Starting market data load for ${symbol}`, {
        symbol,
        progress: `${processedSymbols + 1}/${targetSymbols.length}`,
        percent: progressPercent,
      })
      try {
        // Try to fetch historical data first (30 days back)
        // BingX supports 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
        let realData = await fetchHistoricalMarketData(symbol, "1m", 30)
        if (!realData || realData.candles.length === 0) {
          // Final fallback to real-time fetch
          realData = await fetchRealMarketData(symbol, "1m", 1500)
        }
        
        let candles1s: MarketDataCandle[] = []
        let candles1m: MarketDataCandle[] = []
        let source: string

        if (realData && realData.candles.length > 0) {
          // Determine if we got 1s or 1m data
          const is1sData = realData.candles.length > 0 && realData.candles[0] &&
            (Date.now() - realData.candles[0].timestamp) < 60000 // Recent data suggests 1s
          if (is1sData) {
            candles1s = realData.candles
            // Convert 1s to 1m by aggregating
            candles1m = aggregateCandlesTo1m(candles1s)
          } else {
            candles1m = realData.candles
            // Generate 1s from 1m data (interpolation)
            candles1s = interpolateCandlesTo1s(candles1m)
          }
          source = realData.source
          realDataCount++
        } else {
          // Fall back to synthetic data
          const basePrice = basePrices[symbol] || 100
          candles1m = generateSyntheticCandles(symbol, basePrice, 250)
          candles1s = interpolateCandlesTo1s(candles1m)
          source = "synthetic"
          syntheticCount++
          console.log(`[v0] [MarketData] ⚠ Using synthetic data for ${symbol} (exchange fetch failed)`)
        }

        // Store 1s timeframe data (if available)
        if (candles1s.length > 0) {
          const marketData1s: MarketData = {
            symbol,
            timeframe: "1s",
            candles: candles1s,
            lastUpdated: new Date().toISOString(),
            source,
          }
          const key1s = `market_data:${symbol}:1s`
          await client.set(key1s, JSON.stringify(marketData1s))
          await client.expire(key1s, 86400)
        }

        // Store 1m timeframe data
        const marketData1m: MarketData = {
          symbol,
          timeframe: "1m",
          candles: candles1m,
          lastUpdated: new Date().toISOString(),
          source,
        }
        const key1m = `market_data:${symbol}:1m`
        await client.set(key1m, JSON.stringify(marketData1m))
        await client.expire(key1m, 86400)

        // Store raw candles array for indication processor historical access
        const candlesKey = `market_data:${symbol}:candles`
        await client.set(candlesKey, JSON.stringify(candles1m)) // Use 1m for compatibility
        await client.expire(candlesKey, 86400)

        // Store exchange-specific data for fallback and comparison
        const exchangeKey = `market_data:${symbol}:${source.toLowerCase()}:1m`
        await client.set(exchangeKey, JSON.stringify(marketData1m))
        await client.expire(exchangeKey, 86400)

        console.log(`[v0] [MarketData] ✓ Stored ${candles1m.length} candles for ${symbol} (${source})`)

        await logProgressionEvent("market-data-loader", "market_data_symbol_success", "info", `Successfully loaded ${candles1m.length} candles for ${symbol} from ${source}`, {
          symbol,
          candlesCount: candles1m.length,
          source,
          timeframe: "1m",
        })

        // CRITICAL: Also write latest candle to hash format so getMarketData() works
        const latestCandle = candles1m[candles1m.length - 1]
        if (latestCandle) {
          const hashKey = `market_data:${symbol}`
          const flatHash: Record<string, string> = {
            symbol,
            exchange: source,
            interval: "1m",
            price: String(latestCandle.close),
            open: String(latestCandle.open),
            high: String(latestCandle.high),
            low: String(latestCandle.low),
            close: String(latestCandle.close),
            volume: String(latestCandle.volume),
            timestamp: new Date(latestCandle.timestamp).toISOString(),
            candles_count: String(candles1m.length),
            data_source: source,
          }
          const flatArgs: string[] = []
          for (const [k, v] of Object.entries(flatHash)) {
            flatArgs.push(k, v)
          }
          await client.hmset(hashKey, ...flatArgs)
          await client.expire(hashKey, 86400)
        }

        loaded++
        processedSymbols++

        await logProgressionEvent("market-data-loader", "market_data_symbol_complete", "info", `Completed market data load for ${symbol}`, {
          symbol,
          success: true,
        })
      } catch (error) {
        console.error(`[v0] [MarketData] Failed to load ${symbol}:`, error)
      }
    }

    console.log(`[v0] [MarketData] ✅ Loaded ${loaded}/${targetSymbols.length} symbols`)
    console.log(`[v0] [MarketData]    Real data: ${realDataCount} | Synthetic: ${syntheticCount}`)

    await logProgressionEvent("market-data-loader", "market_data_load_complete", loaded === targetSymbols.length ? "info" : "warning",
      `Market data loading completed: ${loaded}/${targetSymbols.length} symbols loaded (${realDataCount} real, ${syntheticCount} synthetic)`, {
      totalSymbols: targetSymbols.length,
      loadedSymbols: loaded,
      realDataCount,
      syntheticCount,
      success: loaded > 0,
    })

    return loaded
  } catch (error) {
    console.error("[v0] [MarketData] Failed to load market data:", error)
    return 0
  }
}

/**
 * Update market data for a specific symbol with REAL data from exchange
 */
export async function updateMarketDataForSymbol(symbol: string, connectionId?: string): Promise<boolean> {
  try {
    await initRedis()
    const client = getClient()

    // If connectionId provided, use that specific connection
    // Otherwise try all connections
    let candles: MarketDataCandle[] | null = null
    let source = "synthetic"

    if (connectionId) {
      const connections = await getAllConnections()
      const conn = connections.find((c: any) => c.id === connectionId)
      if (conn) {
        const result = await fetchRealMarketData(symbol, "1m", 250)
        if (result) {
          candles = result.candles
          source = result.source
        }
      }
    } else {
      const result = await fetchRealMarketData(symbol, "1m", 250)
      if (result) {
        candles = result.candles
        source = result.source
      }
    }

    // If no real data, use existing or generate synthetic
    if (!candles || candles.length === 0) {
      // Try to get existing data
      const existing = await client.get(`market_data:${symbol}:1m`)
      if (existing) {
        const existingData: MarketData = JSON.parse(existing)
        candles = existingData.candles
        source = existingData.source || "synthetic"
      } else {
        // Generate synthetic
        candles = generateSyntheticCandles(symbol, 100, 250)
        source = "synthetic"
      }
    }

    const marketData: MarketData = {
      symbol,
      timeframe: "1m",
      candles,
      lastUpdated: new Date().toISOString(),
      source,
    }

    const key = `market_data:${symbol}:1m`
    await client.set(key, JSON.stringify(marketData))
    await client.expire(key, 86400)

    // Update candles array
    const candlesKey = `market_data:${symbol}:candles`
    await client.set(candlesKey, JSON.stringify(candles))
    await client.expire(candlesKey, 86400)

    // Update hash
    const latestCandle = candles[candles.length - 1]
    if (latestCandle) {
      const hashKey = `market_data:${symbol}`
      const flatHash: Record<string, string> = {
        symbol,
        exchange: source,
        interval: "1m",
        price: String(latestCandle.close),
        open: String(latestCandle.open),
        high: String(latestCandle.high),
        low: String(latestCandle.low),
        close: String(latestCandle.close),
        volume: String(latestCandle.volume),
        timestamp: new Date(latestCandle.timestamp).toISOString(),
        candles_count: String(candles.length),
        data_source: source,
        last_updated: new Date().toISOString(),
      }
      const flatArgs: string[] = []
      for (const [k, v] of Object.entries(flatHash)) {
        flatArgs.push(k, v)
      }
      await client.hmset(hashKey, ...flatArgs)
      await client.expire(hashKey, 86400)
    }

    console.log(`[v0] [MarketData] ✓ Updated ${symbol} with ${source} data`)
    return source !== "synthetic"
  } catch (error) {
    console.error(`[v0] [MarketData] Failed to update ${symbol}:`, error)
    return false
  }
}

/**
 * Load market data for a specific date range
 * Fetches REAL historical data from exchanges when possible
 */
export async function loadHistoricalMarketData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: string = "1h"
): Promise<MarketDataCandle[]> {
  try {
    // Try to fetch real historical data
    const realData = await fetchRealMarketData(symbol, timeframe, 1000)
    
    if (realData && realData.candles.length > 0) {
      console.log(`[v0] [MarketData] Using real historical data for ${symbol}: ${realData.candles.length} candles`)
      return realData.candles
    }

    // Fall back to synthetic
    console.log(`[v0] [MarketData] Generating synthetic historical data for ${symbol}`)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const candlesPerDay = timeframe === "1h" ? 24 : timeframe === "4h" ? 6 : 1
    const totalCandles = Math.min(daysDiff * candlesPerDay, 1000)

    const candles = generateSyntheticCandles(symbol, 100, totalCandles)

    // Adjust timestamps to match the date range
    const startTimestamp = startDate.getTime()
    const interval = timeframe === "1h" ? 3600000 : timeframe === "4h" ? 14400000 : 86400000

    candles.forEach((candle, index) => {
      candle.timestamp = startTimestamp + index * interval
    })

    console.log(`[v0] [MarketData] Generated synthetic historical for ${symbol}: ${candles.length} candles`)
    return candles
  } catch (error) {
    console.error("[v0] [MarketData] Failed to load historical data:", error)
    return []
  }
}
