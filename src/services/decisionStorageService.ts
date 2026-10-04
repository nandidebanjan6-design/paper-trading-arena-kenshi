import { Decision, REASONING_FACTORS, ReasoningFactor } from '../types/decision';

const STORAGE_KEY = 'pta_decisions_v2';
const BALANCE_KEY = 'pta_balance_v2';

const SEED_DECISIONS: Decision[] = [
  {
    id: 'DEC-103',
    symbol: 'TCS',
    priceAtDecision: 3842.20,
    prediction: 'UP',
    reasoning: ['Trend', 'Momentum'],
    confidence: 78,
    quantity: 10,
    tradePrice: 3842.20,
    outcomePrice: 3918.60,
    outcomeMovePct: 2.0,
    result: 'Correct',
    reflection: {
      reasoningResponsible: 'Yes',
      changeNextTime: 'Keep position sizing consistent when Trend and Momentum align.',
      aiInsight:
        'Your prediction was correct, and Trend · Momentum aligned cleanly. However, your 78% confidence slightly exceeded your historical average (72%)—continue verifying that volume supports high-conviction entries.',
    },
    createdAt: '10:42:18',
    createdTimestamp: Date.now() - 86400000 * 1,
    snapshotPriceSeries: [
      3736.0, 3748.5, 3742.0, 3761.2, 3779.0, 3774.5, 3795.8, 3812.4, 3808.0,
      3826.5, 3834.1, 3842.2,
    ],
  },
  {
    id: 'DEC-102',
    symbol: 'INFY',
    priceAtDecision: 1548.30,
    prediction: 'DOWN',
    reasoning: ['Momentum', 'Valuation'],
    confidence: 64,
    quantity: 15,
    tradePrice: 1548.30,
    outcomePrice: 1567.65,
    outcomeMovePct: 1.25,
    result: 'Incorrect',
    reflection: {
      reasoningResponsible: 'No',
      changeNextTime: 'Wait for support breakdown confirmation before shorting intraday dips.',
      aiInsight:
        'Your prediction was incorrect despite moderate confidence (64%). Shorting on Momentum without a confirmed breakdown often leads to premature entries against mean reversion.',
    },
    createdAt: '14:15:09',
    createdTimestamp: Date.now() - 86400000 * 2,
    snapshotPriceSeries: [
      1560.0, 1557.2, 1561.5, 1554.0, 1551.8, 1555.0, 1549.2, 1546.0, 1550.4,
      1547.1, 1549.8, 1548.3,
    ],
  },
  {
    id: 'DEC-101',
    symbol: 'RELIANCE',
    priceAtDecision: 1426.50,
    prediction: 'UP',
    reasoning: ['Momentum'],
    confidence: 74,
    quantity: 20,
    tradePrice: 1426.50,
    outcomePrice: 1452.18,
    outcomeMovePct: 1.8,
    result: 'Correct',
    reflection: {
      reasoningResponsible: 'Yes',
      changeNextTime: 'Record specific invalidation levels before locking the decision.',
      aiInsight:
        'Your prediction was correct at 74% confidence. Decisions grounded in Momentum have historically been your most reliable setup when paired with measured conviction.',
    },
    createdAt: '11:20:44',
    createdTimestamp: Date.now() - 86400000 * 3,
    snapshotPriceSeries: [
      1403.8, 1406.2, 1409.5, 1407.0, 1412.4, 1415.8, 1414.2, 1419.0, 1422.6,
      1421.0, 1424.8, 1426.5,
    ],
  },
];

export function loadDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DECISIONS));
      return SEED_DECISIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_DECISIONS;
  } catch {
    return SEED_DECISIONS;
  }
}

export function saveDecisions(decisions: Decision[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function loadVirtualBalance(): number {
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    if (!raw) return 1000000;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 1000000;
  } catch {
    return 1000000;
  }
}

export function saveVirtualBalance(balance: number): void {
  try {
    localStorage.setItem(BALANCE_KEY, String(balance));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generates a concise educational AI Reflection insight based on:
 * - prediction
 * - reasoning
 * - confidence
 * - outcome
 * - reflection
 * - historical decisions
 * Never provides financial or investment advice.
 */
export function generateAIReflectionInsight(
  decision: Decision,
  allDecisions: Decision[]
): string {
  const previousDecisions = allDecisions.filter((d) => d.id !== decision.id);
  const avgPrevConfidence =
    previousDecisions.length > 0
      ? Math.round(
          previousDecisions.reduce((sum, d) => sum + d.confidence, 0) /
            previousDecisions.length
        )
      : 70;

  const isCorrect = decision.result === 'Correct';
  const confDiff = decision.confidence - avgPrevConfidence;
  const reasonsText = decision.reasoning.join(' · ');

  if (isCorrect && confDiff >= 5) {
    return `Your prediction was correct, but your confidence (${decision.confidence}%) was higher than your previous decisions (${avgPrevConfidence}%). Consider whether your ${reasonsText} evidence justified that elevated conviction.`;
  }

  if (isCorrect && decision.reflection?.reasoningResponsible === 'Partially') {
    return `Your ${decision.prediction} prediction succeeded, and you noted that ${reasonsText} was only partially responsible. Separating fortunate market drift from repeatable thesis quality keeps confidence calibrated.`;
  }

  if (isCorrect) {
    return `Your ${decision.prediction} thesis on ${decision.symbol} held up cleanly at ${decision.confidence}% confidence. Your ${reasonsText} reasoning aligned with both the outcome and your historical calibration range.`;
  }

  if (!isCorrect && decision.confidence >= 75) {
    return `Your prediction was incorrect while carrying high confidence (${decision.confidence}%). When relying on ${reasonsText}, consider requiring stronger confirmation before assigning >75% conviction.`;
  }

  return `Market movement diverged from your ${decision.prediction} prediction (${decision.confidence}% confidence). Recording what you would change next time turns an incorrect ${reasonsText} thesis into a calibrated learning data point.`;
}

export interface DerivedPattern {
  mostUsedReasoning: ReasoningFactor;
  usageCount: number;
  accuracyUsingReasoning: number;
  averageConfidenceUsingReasoning: number;
  allReasoningStats: {
    factor: ReasoningFactor;
    count: number;
    accuracy: number;
    avgConfidence: number;
  }[];
}

/**
 * Pattern Detection Engine:
 * Dynamically derives the user's most-used reasoning factor, accuracy when using it,
 * and average confidence from stored decision data. Nothing is hardcoded.
 */
export function deriveDecisionPatterns(decisions: Decision[]): DerivedPattern | null {
  if (decisions.length === 0) return null;

  const statsMap = new Map<
    ReasoningFactor,
    { count: number; correct: number; totalConf: number }
  >();

  REASONING_FACTORS.forEach((f) => {
    statsMap.set(f, { count: 0, correct: 0, totalConf: 0 });
  });

  decisions.forEach((d) => {
    d.reasoning.forEach((factor) => {
      const current = statsMap.get(factor) || {
        count: 0,
        correct: 0,
        totalConf: 0,
      };
      statsMap.set(factor, {
        count: current.count + 1,
        correct: current.correct + (d.result === 'Correct' ? 1 : 0),
        totalConf: current.totalConf + d.confidence,
      });
    });
  });

  const allReasoningStats = Array.from(statsMap.entries())
    .filter(([, s]) => s.count > 0)
    .map(([factor, s]) => ({
      factor,
      count: s.count,
      accuracy: Math.round((s.correct / s.count) * 100),
      avgConfidence: Math.round(s.totalConf / s.count),
    }))
    .sort((a, b) => b.count - a.count);

  if (allReasoningStats.length === 0) return null;

  const top = allReasoningStats[0];
  return {
    mostUsedReasoning: top.factor,
    usageCount: top.count,
    accuracyUsingReasoning: top.accuracy,
    averageConfidenceUsingReasoning: top.avgConfidence,
    allReasoningStats,
  };
}

export interface CalibrationMetrics {
  totalDecisions: number;
  overallAccuracy: number;
  averageConfidence: number;
  reflectionRate: number;
  calibrationStatus: 'Confidence > Evidence' | 'Confidence < Results' | 'Confidence aligned with results';
  calibrationDelta: number;
}

/**
 * Confidence Calibration Engine:
 * Compares how confident the user was against how often decisions were actually correct.
 */
export function calculateConfidenceCalibration(
  decisions: Decision[]
): CalibrationMetrics {
  if (decisions.length === 0) {
    return {
      totalDecisions: 0,
      overallAccuracy: 0,
      averageConfidence: 0,
      reflectionRate: 0,
      calibrationStatus: 'Confidence aligned with results',
      calibrationDelta: 0,
    };
  }

  const totalDecisions = decisions.length;
  const correctCount = decisions.filter((d) => d.result === 'Correct').length;
  const overallAccuracy = Math.round((correctCount / totalDecisions) * 100);
  const averageConfidence = Math.round(
    decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions
  );
  const reflectedCount = decisions.filter((d) => d.reflection !== null).length;
  const reflectionRate = Math.round((reflectedCount / totalDecisions) * 100);

  const calibrationDelta = averageConfidence - overallAccuracy;
  let calibrationStatus: CalibrationMetrics['calibrationStatus'] =
    'Confidence aligned with results';

  if (calibrationDelta > 6) {
    calibrationStatus = 'Confidence > Evidence';
  } else if (calibrationDelta < -8) {
    calibrationStatus = 'Confidence < Results';
  }

  return {
    totalDecisions,
    overallAccuracy,
    averageConfidence,
    reflectionRate,
    calibrationStatus,
    calibrationDelta,
  };
}
