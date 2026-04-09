import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const indicationsData = {
    indications: {
      direction: {
        count: 4872,
        avgSignalStrength: 0.67,
        lastTrigger: new Date(Date.now() - 3 * 60000).toISOString(),
        profitFactor: 1.32
      },
      move: {
        count: 2154,
        avgSignalStrength: 0.59,
        lastTrigger: new Date(Date.now() - 8 * 60000).toISOString(),
        profitFactor: 1.19
      },
      active: {
        count: 1823,
        avgSignalStrength: 0.73,
        lastTrigger: new Date(Date.now() - 12 * 60000).toISOString(),
        profitFactor: 1.45
      },
      optimal: {
        count: 721,
        avgSignalStrength: 0.82,
        lastTrigger: new Date(Date.now() - 18 * 60000).toISOString(),
        profitFactor: 1.68
      }
    }
  }

  return res.status(200).json(indicationsData)
}