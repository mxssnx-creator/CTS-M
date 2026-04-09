import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simulate realistic trading statistics data
  const statsData = {
    last250: {
      total: 247,
      wins: 132,
      losses: 115,
      winRate: 0.534,
      profitFactor: 1.27,
      totalProfit: 3421.57
    },
    last50: {
      total: 48,
      wins: 31,
      losses: 17,
      winRate: 0.646,
      profitFactor: 1.52,
      totalProfit: 987.42
    },
    last32h: {
      total: 29,
      totalProfit: 523.89,
      profitFactor: 1.38
    }
  }

  return res.status(200).json(statsData)
}