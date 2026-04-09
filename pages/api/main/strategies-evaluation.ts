import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const strategiesData = {
    strategies: {
      base: {
        count: 23,
        winRate: 0.512,
        drawdown: 12.4,
        drawdownHours: 14.2,
        profitFactor250: 1.18,
        profitFactor50: 1.25
      },
      main: {
        count: 17,
        winRate: 0.578,
        drawdown: 8.7,
        drawdownHours: 7.8,
        profitFactor250: 1.34,
        profitFactor50: 1.48
      },
      real: {
        count: 9,
        winRate: 0.621,
        drawdown: 5.3,
        drawdownHours: 4.1,
        profitFactor250: 1.47,
        profitFactor50: 1.62
      },
      live: {
        count: 4,
        winRate: 0.685,
        drawdown: 3.1,
        drawdownHours: 2.3,
        profitFactor250: 1.61,
        profitFactor50: 1.79
      }
    }
  }

  return res.status(200).json(strategiesData)
}