'use client'

import { useEffect, useRef } from 'react'
import { getSystemVersionInfo, COMPONENT_VERSIONS, API_VERSIONS } from '@/lib/system-version'
import { logProgressionEvent } from '@/lib/engine-progression-logs'

let initializationPromise: Promise<void> | null = null
let hasInitialized = false

async function initializeSystem() {
  // Prevent multiple concurrent initializations
  if (initializationPromise) {
    return initializationPromise
  }
  if (hasInitialized) {
    return Promise.resolve()
  }

  initializationPromise = (async () => {
    try {
      const versionInfo = getSystemVersionInfo()
      console.log('[v0] [SystemInitializer] ========================================')
      console.log('[v0] [SystemInitializer] SYSTEM VERSION INFO:')
      console.log('[v0] [SystemInitializer] System Version:', versionInfo.system)
      console.log('[v0] [SystemInitializer] Component Versions:', JSON.stringify(versionInfo.components, null, 2))
      console.log('[v0] [SystemInitializer] API Versions:', JSON.stringify(versionInfo.apis, null, 2))
      console.log('[v0] [SystemInitializer] Build Time:', versionInfo.buildTime)
      console.log('[v0] [SystemInitializer] ========================================')

      console.log('[v0] [SystemInitializer] Starting comprehensive system initialization...')

      await logProgressionEvent("system-init", "system_init_start", "info", "Starting comprehensive system initialization", {
        systemVersion: versionInfo.system,
        environment: process.env.NODE_ENV || "development",
        buildTime: versionInfo.buildTime
      })

      // STEP 1: Run /api/init for general initialization
      console.log('[v0] [SystemInitializer] Step 1/2: Running API initialization...')
      await logProgressionEvent("system-init", "system_init_api_init", "info", "Running API initialization", {})

      const initResponse = await fetch('/api/init', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'X-System-Version': versionInfo.system,
          'X-Component-Version': COMPONENT_VERSIONS.systemInitializer,
        },
      })

      if (initResponse.ok) {
        const initResult = await initResponse.json()
        console.log('[v0] [SystemInitializer] API init complete:', initResult.message)
        await logProgressionEvent("system-init", "system_init_api_complete", "info", "API initialization complete", {
          result: initResult.message
        })
      } else {
        console.warn('[v0] [SystemInitializer] API init returned status:', initResponse.status)
        await logProgressionEvent("system-init", "system_init_api_warning", "warning", `API init returned status: ${initResponse.status}`, {
          status: initResponse.status
        })
      }

      // STEP 2: Run comprehensive startup initialization
      console.log('[v0] [SystemInitializer] Step 2/2: Running startup initialization...')
      await logProgressionEvent("system-init", "system_init_startup_start", "info", "Running startup initialization", {})

      const startupResponse = await fetch('/api/startup/initialize', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-System-Version': versionInfo.system,
          'X-API-Version': API_VERSIONS.tradeEngine,
        },
      })

      if (!startupResponse.ok) {
        console.warn('[v0] [SystemInitializer] Startup returned:', startupResponse.status)
        await logProgressionEvent("system-init", "system_init_startup_failed", "error", `Startup initialization failed with status: ${startupResponse.status}`, {
          status: startupResponse.status
        })
        return
      }

      const startupResult = await startupResponse.json()

      if (startupResult.success) {
        console.log('[v0] [SystemInitializer] ✓ System fully initialized')
        console.log('[v0] [SystemInitializer] Results:', startupResult.results)
        hasInitialized = true

        await logProgressionEvent("system-init", "system_init_complete", "info", "System fully initialized and ready for user interaction", {
          enginesRunning: startupResult.summary?.baseWithCredentials || 0,
          totalConnections: startupResult.summary?.totalConnections || 0,
          baseConnections: startupResult.summary?.baseConnections || 0,
          environment: process.env.NODE_ENV || "development"
        })
      } else {
        console.error('[v0] [SystemInitializer] Startup failed:', startupResult.error)
        await logProgressionEvent("system-init", "system_init_startup_error", "error", `Startup initialization failed: ${startupResult.error}`, {
          error: startupResult.error
        })
      }
    } catch (error) {
      console.error('[v0] [SystemInitializer] Error initializing system:', error)
      await logProgressionEvent("system-init", "system_init_error", "error", `System initialization error: ${error instanceof Error ? error.message : String(error)}`, {
        error: error instanceof Error ? error.message : String(error),
        environment: process.env.NODE_ENV || "development"
      })
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

export function SystemInitializer() {
  const hasTriedInit = useRef(false)

  useEffect(() => {
    if (hasTriedInit.current) return
    hasTriedInit.current = true

    // Initialize system immediately
    initializeSystem()
  }, [])

  return null
}
