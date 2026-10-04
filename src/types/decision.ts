export type PredictionDirection = 'UP' | 'DOWN';

export type ReasoningFactor = 'Trend' | 'Momentum' | 'News' | 'Valuation' | 'Other';

export const REASONING_FACTORS: ReasoningFactor[] = [
  'Trend',
  'Momentum',
  'News',
  'Valuation',
  'Other',
];

export type AttributionChoice = 'Yes' | 'Partially' | 'No';

export interface ReflectionData {
  reasoningResponsible: AttributionChoice;
  changeNextTime: string;
  aiInsight?: string;
}

export interface Decision {
  id: string;
  symbol: string;
  priceAtDecision: number; // Strictly immutable once locked
  prediction: PredictionDirection;
  reasoning: ReasoningFactor[];
  confidence: number;
  quantity: number;
  tradePrice: number;
  outcomePrice: number;
  outcomeMovePct: number;
  result: 'Correct' | 'Incorrect';
  reflection: ReflectionData | null;
  createdAt: string; // HH:MM:SS or formatted timestamp
  createdTimestamp: number;
  snapshotPriceSeries: number[]; // Frozen chart series at the moment of decision
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  series: number[];
  isSimulated: boolean;
  lastUpdated: string;
}
