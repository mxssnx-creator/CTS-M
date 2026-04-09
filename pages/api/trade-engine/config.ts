import { NextApiRequest, NextApiResponse } from 'next'
import { getRedisClient } from "@/lib/redis-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { connectionId, liveVolumeFactor, presetVolumeFactor, orderType, volumeType } = req.body
    
    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId is required' })
    }

    const client = getRedisClient()
    
    // Store configuration in Redis for running engine
    await client.hset(`engine_config:${connectionId}`, {
      liveVolumeFactor: liveVolumeFactor ?? 1.0,
      presetVolumeFactor: presetVolumeFactor ?? 1.0,
      orderType: orderType ?? 'market',
      volumeType: volumeType ?? 'usdt',
      updatedAt: Date.now().toString()
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Configuration updated',
      config: { liveVolumeFactor, presetVolumeFactor, orderType, volumeType }
    })
  } catch (error) {
    console.error('Engine config update error:', error)
    return res.status(500).json({ error: 'Failed to update configuration' })
  }
}