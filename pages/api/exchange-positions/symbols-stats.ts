import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbolsData = {
    symbols: [
      { symbol: "BTCUSDT", livePositions: 2, profitFactor250: 1.42, profitFactor50: 1.57 },
      { symbol: "ETHUSDT", livePositions: 3, profitFactor250: 1.35, profitFactor50: 1.48 },
      { symbol: "SOLUSDT", livePositions: 1, profitFactor250: 1.28, profitFactor50: 1.62 },
      { symbol: "AVAXUSDT", livePositions: 0, profitFactor250: 1.19, profitFactor50: 1.37 },
      { symbol: "MATICUSDT", livePositions: 1, profitFactor250: 1.23, profitFactor50: 1.41 },
      { symbol: "LINKUSDT", livePositions: 0, profitFactor250: 1.31, profitFactor50: 1.39 },
      { symbol: "DOTUSDT", livePositions: 1, profitFactor250: 1.15, profitFactor50: 1.27 },
      { symbol: "ATOMUSDT", livePositions: 0, profitFactor250: 1.21, profitFactor50: 1.33 }
    ]
  }

  return res.status(200).json(symbolsData)
}