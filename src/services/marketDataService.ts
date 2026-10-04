import { MarketQuote, PredictionDirection } from '../types/decision';

const FALLBACK_QUOTES: Record<string, MarketQuote> = {
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3842.20,
    changePct: 2.84,
    series: [
      3736.0, 3748.5, 3742.0, 3761.2, 3779.0, 3774.5, 3795.8, 3812.4, 3808.0,
      3826.5, 3834.1, 3842.2,
    ],
    isSimulated: true,
    lastUpdated: '10:42:18',
  },
  INFY: {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1548.30,
    changePct: -0.74,
    series: [
      1560.0, 1557.2, 1561.5, 1554.0, 1551.8, 1555.0, 1549.2, 1546.0, 1550.4,
      1547.1, 1549.8, 1548.3,
    ],
    isSimulated: true,
    lastUpdated: '10:42:18',
  },
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    price: 1426.50,
    changePct: 1.62,
    series: [
      1403.8, 1406.2, 1409.5, 1407.0, 1412.4, 1415.8, 1414.2, 1419.0, 1422.6,
      1421.0, 1424.8, 1426.5,
    ],
    isSimulated: true,
    lastUpdated: '10:42:18',
  },
};

export const SUPPORTED_SYMBOLS = ['TCS', 'INFY', 'RELIANCE'] as const;

export function formatINR(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatTimeNow(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

/**
 * Fetches market data with realistic latency and clean fallback to sample market data.
 * Never claims demo data is live.
 */
export async function fetchMarketQuotes(
  forceError = false
): Promise<{ quotes: MarketQuote[]; source: 'sample' | 'live' }> {
  await new Promise((resolve) => setTimeout(resolve, 240));

  if (forceError) {
    throw new Error('Market data unavailable');
  }

  const nowStr = formatTimeNow();
  const quotes = SUPPORTED_SYMBOLS.map((sym) => ({
    ...FALLBACK_QUOTES[sym],
    series: [...FALLBACK_QUOTES[sym].series],
    lastUpdated: nowStr,
  }));

  return {
    quotes,
    source: 'sample',
  };
}

/**
 * Outcome Engine:
 * Calculates the simulated market outcome from the immutable priceAtDecision snapshot
 * and compares prediction vs actual movement to determine Correct / Incorrect.
 */
export function calculateSimulatedOutcome(params: {
  symbol: string;
  priceAtDecision: number;
  prediction: PredictionDirection;
  reasoning: string[];
  decisionIndex: number;
}): {
  outcomePrice: number;
  outcomeMovePct: number;
  actualDirection: PredictionDirection;
  result: 'Correct' | 'Incorrect';
  outcomeSeries: number[];
} {
  const { symbol, priceAtDecision, prediction, reasoning, decisionIndex } = params;

  // For the primary TCS demo or first run on TCS, produce the exact signature +2.0% move (₹3,842.20 -> ₹3,918.60)
  if (symbol === 'TCS' && Math.abs(priceAtDecision - 3842.2) < 1 && decisionIndex % 3 !== 2) {
    const outcomePrice = 3918.60;
    const outcomeMovePct = 2.0;
    const actualDirection: PredictionDirection = 'UP';
    const result = prediction === actualDirection ? 'Correct' : 'Incorrect';
    const outcomeSeries = [
      3842.2,
      3854.0,
      3868.4,
      3862.0,
      3885.5,
      3904.2,
      3918.6,
    ];
    return {
      outcomePrice,
      outcomeMovePct,
      actualDirection,
      result,
      outcomeSeries,
    };
  }

  // Deterministic yet dynamic market movement calculation based on symbol structure & cycle
  const hasTrendOrMomentum =
    reasoning.includes('Trend') || reasoning.includes('Momentum');

  let signedMovePct = 1.6;
  if (symbol === 'INFY') {
    signedMovePct = decisionIndex % 2 === 0 ? -1.4 : 1.25;
  } else if (symbol === 'RELIANCE') {
    signedMovePct = decisionIndex % 3 === 1 ? -1.1 : 1.8;
  } else {
    signedMovePct = hasTrendOrMomentum ? 2.0 : -1.3;
  }

  const outcomePrice = Number(
    (priceAtDecision * (1 + signedMovePct / 100)).toFixed(2)
  );
  const actualDirection: PredictionDirection =
    outcomePrice >= priceAtDecision ? 'UP' : 'DOWN';
  const result = prediction === actualDirection ? 'Correct' : 'Incorrect';

  const step = (outcomePrice - priceAtDecision) / 5;
  const outcomeSeries = [
    priceAtDecision,
    Number((priceAtDecision + step * 1.1).toFixed(2)),
    Number((priceAtDecision + step * 1.8).toFixed(2)),
    Number((priceAtDecision + step * 2.9).toFixed(2)),
    Number((priceAtDecision + step * 4.1).toFixed(2)),
    outcomePrice,
  ];

  return {
    outcomePrice,
    outcomeMovePct: Number(signedMovePct.toFixed(2)),
    actualDirection,
    result,
    outcomeSeries,
  };
}
