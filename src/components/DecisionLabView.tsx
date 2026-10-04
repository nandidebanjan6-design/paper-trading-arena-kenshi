import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AttributionChoice,
  Decision,
  MarketQuote,
  PredictionDirection,
  REASONING_FACTORS,
  ReasoningFactor,
} from '../types/decision';
import {
  calculateSimulatedOutcome,
  formatINR,
  formatTimeNow,
} from '../services/marketDataService';
import {
  calculateConfidenceCalibration,
  deriveDecisionPatterns,
  generateAIReflectionInsight,
} from '../services/decisionStorageService';
import { MiniPriceChart } from './MiniPriceChart';
import { DecisionReplayTimeline } from './DecisionReplayTimeline';

interface DecisionLabViewProps {
  quotes: MarketQuote[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  decisions: Decision[];
  onSaveDecision: (decision: Decision) => void;
  onUpdateDecision: (decision: Decision) => void;
}

type LabStep = 'predict' | 'locked_trade' | 'outcome';

export const DecisionLabView: React.FC<DecisionLabViewProps> = ({
  quotes,
  loading,
  error,
  onRetry,
  selectedSymbol,
  onSelectSymbol,
  decisions,
  onSaveDecision,
  onUpdateDecision,
}) => {
  const navigate = useNavigate();

  // Step 1: Prediction state
  const [prediction, setPrediction] = useState<PredictionDirection>('UP');
  const [selectedReasoning, setSelectedReasoning] = useState<ReasoningFactor[]>([
    'Trend',
    'Momentum',
  ]);
  const [confidence, setConfidence] = useState<number>(78);

  // Step 2: Immutable Decision Snapshot state
  const [step, setStep] = useState<LabStep>('predict');
  const [lockedSnapshot, setLockedSnapshot] = useState<{
    symbol: string;
    priceAtDecision: number;
    prediction: PredictionDirection;
    reasoning: ReasoningFactor[];
    confidence: number;
    time: string;
    series: number[];
  } | null>(null);

  // Step 2b: Trade interface state
  const [quantity, setQuantity] = useState<number>(10);

  // Step 3: Outcome, Replay & Reflection state
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
  const [outcomeSeries, setOutcomeSeries] = useState<number[] | undefined>(
    undefined
  );
  const [showReplay, setShowReplay] = useState<boolean>(false);

  // Reflection inputs
  const [reasoningResponsible, setReasoningResponsible] =
    useState<AttributionChoice>('Yes');
  const [changeNextTime, setChangeNextTime] = useState<string>('');
  const [reflectionSaved, setReflectionSaved] = useState<boolean>(false);

  const currentQuote =
    quotes.find((q) => q.symbol === selectedSymbol) || quotes[0];

  const toggleReasoning = (factor: ReasoningFactor) => {
    if (step !== 'predict') return;
    setSelectedReasoning((prev) => {
      if (prev.includes(factor)) {
        if (prev.length === 1) return prev; // Keep at least 1 reasoning factor
        return prev.filter((f) => f !== factor);
      }
      return [...prev, factor];
    });
  };

  // Lock Decision -> Creates immutable Decision Snapshot
  const handleLockDecision = () => {
    if (!currentQuote) return;
    const frozenSnapshot = {
      symbol: currentQuote.symbol,
      priceAtDecision: currentQuote.price, // Frozen immutable price at decision
      prediction,
      reasoning: [...selectedReasoning],
      confidence,
      time: formatTimeNow(),
      series: [...currentQuote.series],
    };
    setLockedSnapshot(frozenSnapshot);
    setStep('locked_trade');
  };

  // Simulate Trade -> Runs Outcome Engine against the frozen Decision Snapshot
  const handleSimulateTrade = () => {
    if (!lockedSnapshot) return;

    const validQty = Math.max(1, Math.round(quantity || 10));
    const outcome = calculateSimulatedOutcome({
      symbol: lockedSnapshot.symbol,
      priceAtDecision: lockedSnapshot.priceAtDecision,
      prediction: lockedSnapshot.prediction,
      reasoning: lockedSnapshot.reasoning,
      decisionIndex: decisions.length,
    });

    const newDecision: Decision = {
      id: `DEC-${104 + decisions.length}`,
      symbol: lockedSnapshot.symbol,
      priceAtDecision: lockedSnapshot.priceAtDecision,
      prediction: lockedSnapshot.prediction,
      reasoning: lockedSnapshot.reasoning,
      confidence: lockedSnapshot.confidence,
      quantity: validQty,
      tradePrice: lockedSnapshot.priceAtDecision,
      outcomePrice: outcome.outcomePrice,
      outcomeMovePct: outcome.outcomeMovePct,
      result: outcome.result,
      reflection: null,
      createdAt: lockedSnapshot.time,
      createdTimestamp: Date.now(),
      snapshotPriceSeries: lockedSnapshot.series,
    };

    // Pre-generate educational AI reflection insight
    const initialAiInsight = generateAIReflectionInsight(
      newDecision,
      decisions
    );
    newDecision.reflection = {
      reasoningResponsible: 'Yes',
      changeNextTime: '',
      aiInsight: initialAiInsight,
    };

    setActiveDecision(newDecision);
    setOutcomeSeries(outcome.outcomeSeries);
    setReasoningResponsible('Yes');
    setChangeNextTime('');
    setReflectionSaved(false);
    setShowReplay(true);
    onSaveDecision(newDecision);
    setStep('outcome');
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDecision) return;

    const updated: Decision = {
      ...activeDecision,
      reflection: {
        reasoningResponsible,
        changeNextTime:
          changeNextTime.trim() ||
          'Verify volume confirmation before committing to high confidence.',
        aiInsight: generateAIReflectionInsight(
          {
            ...activeDecision,
            reflection: {
              reasoningResponsible,
              changeNextTime,
            },
          },
          decisions
        ),
      },
    };

    setActiveDecision(updated);
    onUpdateDecision(updated);
    setReflectionSaved(true);
  };

  const handleStartNewDecision = () => {
    setLockedSnapshot(null);
    setActiveDecision(null);
    setOutcomeSeries(undefined);
    setShowReplay(false);
    setReflectionSaved(false);
    setStep('predict');
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="h-7 w-40 bg-[#E6E4DF] rounded animate-pulse" />
        <div className="h-64 w-full bg-[#E6E4DF]/60 rounded-[6px] animate-pulse" />
        <div className="h-48 w-full bg-[#E6E4DF]/60 rounded-[6px] animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error || !currentQuote) {
    return (
      <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-20 text-center">
        <p className="text-base font-medium text-[#141413] mb-2">
          Market data unavailable
        </p>
        <p className="text-xs text-[#5C5B57] mb-6">
          Unable to load market feed for the Decision Lab.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 bg-[#141413] text-[#F9F8F6] text-xs font-medium rounded-[4px] cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  const displaySymbol = lockedSnapshot
    ? lockedSnapshot.symbol
    : currentQuote.symbol;
  const displayPrice = lockedSnapshot
    ? lockedSnapshot.priceAtDecision
    : currentQuote.price;
  const displaySeries = lockedSnapshot
    ? lockedSnapshot.series
    : currentQuote.series;
  const isPositive = currentQuote.changePct >= 0;

  const pattern = deriveDecisionPatterns(decisions);
  const calibration = calculateConfidenceCalibration(decisions);

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header & Asset Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E6E4DF]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight">
            Decision Lab
          </h1>
        </div>

        {/* Asset Selection Tabs */}
        <div className="flex items-center gap-2">
          {quotes.map((q) => {
            const active = q.symbol === displaySymbol;
            return (
              <button
                key={q.symbol}
                type="button"
                disabled={step !== 'predict'}
                onClick={() => onSelectSymbol(q.symbol)}
                className={`px-3.5 py-1.5 rounded-[4px] font-mono text-xs transition-colors border whitespace-nowrap ${
                  active
                    ? 'bg-[#141413] text-[#F9F8F6] border-[#141413] font-medium'
                    : 'bg-[#FFFFFF] text-[#5C5B57] border-[#E6E4DF] hover:text-[#141413] hover:border-[#141413]'
                } ${
                  step !== 'predict'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {q.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Asset & Primary Clean Price Chart */}
      <section
        aria-label="Selected Asset and Price Chart"
        className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <div>
            <div className="text-xl sm:text-2xl font-semibold text-[#141413]">
              {displaySymbol}
            </div>
            <div className="font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#141413] mt-1">
              {formatINR(displayPrice)}
            </div>
            <div
              className={`font-mono tabular-nums text-xs sm:text-sm font-medium mt-0.5 ${
                isPositive ? 'text-[#156F43]' : 'text-[#B4322B]'
              }`}
            >
              {isPositive ? '+' : ''}
              {currentQuote.changePct.toFixed(2)}%
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-[11px] text-[#8A8882] flex items-center gap-1.5">
              <span className="text-[#156F43] text-[9px]">●</span>
              <span>
                {step === 'predict'
                  ? 'SAMPLE MARKET FEED'
                  : 'SNAPSHOT FROZEN AT DECISION'}
              </span>
            </span>
          </div>
        </div>

        <MiniPriceChart
          points={displaySeries}
          isPositive={isPositive}
          height={160}
          showSecondaryLine={step === 'outcome' ? outcomeSeries : undefined}
        />
      </section>

      {/* STAGE 1: THE UNIQUE PART — PREDICTION */}
      {step === 'predict' && (
        <section
          aria-label="Commit to a Thesis"
          className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-8 max-w-[720px]"
        >
          <div className="space-y-7">
            {/* What happens next? */}
            <div>
              <h2 className="text-base font-medium text-[#141413] mb-3">
                What happens next?
              </h2>
              <div className="grid grid-cols-2 gap-3 max-w-[380px]">
                <button
                  type="button"
                  onClick={() => setPrediction('UP')}
                  className={`h-12 px-5 rounded-[4px] font-mono text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    prediction === 'UP'
                      ? 'bg-[#EDF5F0] border-[#156F43] text-[#156F43]'
                      : 'bg-[#F9F8F6] border-[#E6E4DF] text-[#5C5B57] hover:border-[#141413] hover:text-[#141413]'
                  }`}
                >
                  <span>↑ UP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrediction('DOWN')}
                  className={`h-12 px-5 rounded-[4px] font-mono text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    prediction === 'DOWN'
                      ? 'bg-[#F9EFEF] border-[#B4322B] text-[#B4322B]'
                      : 'bg-[#F9F8F6] border-[#E6E4DF] text-[#5C5B57] hover:border-[#141413] hover:text-[#141413]'
                  }`}
                >
                  <span>↓ DOWN</span>
                </button>
              </div>
            </div>

            {/* Why? Selectable reasoning */}
            <div>
              <h2 className="text-base font-medium text-[#141413] mb-3">
                Why?
              </h2>
              <div className="flex flex-wrap gap-2">
                {REASONING_FACTORS.map((factor) => {
                  const active = selectedReasoning.includes(factor);
                  return (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => toggleReasoning(factor)}
                      className={`px-4 py-2 rounded-[4px] text-xs font-medium border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#141413] text-[#F9F8F6] border-[#141413]'
                          : 'bg-[#F9F8F6] text-[#5C5B57] border-[#E6E4DF] hover:border-[#141413] hover:text-[#141413]'
                      }`}
                    >
                      {factor}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confidence Slider with Large Number */}
            <div className="max-w-[420px]">
              <div className="flex items-baseline justify-between mb-2">
                <label
                  htmlFor="confidence-range"
                  className="text-base font-medium text-[#141413]"
                >
                  Confidence
                </label>
                <span className="font-mono tabular-nums text-3xl font-semibold text-[#141413]">
                  {confidence}%
                </span>
              </div>
              <input
                id="confidence-range"
                type="range"
                min={50}
                max={99}
                step={1}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="decision-slider"
              />
            </div>

            {/* Lock Decision Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLockDecision}
                className="px-6 py-3 bg-[#141413] text-[#F9F8F6] text-sm font-medium rounded-[4px] hover:bg-[#2A2A28] active:scale-[0.99] transition-all cursor-pointer"
              >
                Lock Decision
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STAGE 2: TECHNICAL WOW FACTOR — IMMUTABLE DECISION SNAPSHOT + SIMPLE TRADE */}
      {step === 'locked_trade' && lockedSnapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Permanent Decision Snapshot */}
          <section
            aria-label="Immutable Decision Snapshot"
            className="lg:col-span-6 bg-[#F2F0EC] border border-[#141413] rounded-[6px] p-5 sm:p-7"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E4DF]">
              <span className="font-mono text-xs font-semibold tracking-[0.12em] text-[#141413]">
                DECISION SNAPSHOT
              </span>
              <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-[#156F43]">
                DECISION LOCKED
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <div className="text-lg font-semibold text-[#141413]">
                  {lockedSnapshot.symbol}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DF]">
                <div>
                  <div className="text-xs text-[#5C5B57]">Price at decision</div>
                  <div className="font-mono tabular-nums text-base font-medium text-[#141413] mt-0.5">
                    {formatINR(lockedSnapshot.priceAtDecision)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#5C5B57]">Prediction</div>
                  <div
                    className={`font-mono text-base font-semibold mt-0.5 ${
                      lockedSnapshot.prediction === 'UP'
                        ? 'text-[#156F43]'
                        : 'text-[#B4322B]'
                    }`}
                  >
                    {lockedSnapshot.prediction === 'UP' ? '↑ UP' : '↓ DOWN'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#5C5B57]">Reasoning</div>
                  <div className="text-sm font-medium text-[#141413] mt-0.5">
                    {lockedSnapshot.reasoning.join(' · ')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#5C5B57]">Confidence</div>
                  <div className="font-mono tabular-nums text-base font-semibold text-[#141413] mt-0.5">
                    {lockedSnapshot.confidence}%
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-[#E6E4DF] flex items-center justify-between">
                  <span className="text-xs text-[#5C5B57]">Time</span>
                  <span className="font-mono tabular-nums text-xs text-[#141413]">
                    {lockedSnapshot.time}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Simple Trade Interface */}
          <section
            aria-label="Simulate Trade"
            className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
          >
            <div className="pb-4 border-b border-[#E6E4DF]">
              <span className="font-mono text-xs tracking-[0.12em] text-[#5C5B57]">
                TRADE EXECUTION
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between py-1.5 border-b border-[#E6E4DF]">
                <span className="text-[#5C5B57]">Asset</span>
                <span className="font-mono font-semibold text-[#141413]">
                  {lockedSnapshot.symbol}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#E6E4DF]">
                <span className="text-[#5C5B57]">Decision</span>
                <span
                  className={`font-mono font-semibold ${
                    lockedSnapshot.prediction === 'UP'
                      ? 'text-[#156F43]'
                      : 'text-[#B4322B]'
                  }`}
                >
                  {lockedSnapshot.prediction === 'UP' ? '↑ UP' : '↓ DOWN'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#E6E4DF]">
                <span className="text-[#5C5B57]">Confidence</span>
                <span className="font-mono tabular-nums font-semibold text-[#141413]">
                  {lockedSnapshot.confidence}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E6E4DF]">
                <label htmlFor="trade-quantity" className="text-[#5C5B57]">
                  Quantity
                </label>
                <input
                  id="trade-quantity"
                  type="number"
                  min={1}
                  max={1000}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-24 text-right font-mono tabular-nums text-sm font-medium text-[#141413] bg-[#F9F8F6] border border-[#E6E4DF] rounded-[4px] px-2.5 py-1 focus:outline-none focus:border-[#141413]"
                />
              </div>

              <div className="flex justify-between py-2">
                <span className="text-[#5C5B57]">Estimated value</span>
                <span className="font-mono tabular-nums text-base font-semibold text-[#141413]">
                  {formatINR(
                    Math.round(quantity * lockedSnapshot.priceAtDecision),
                    0
                  )}
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleSimulateTrade}
                  className="w-full py-3 px-5 bg-[#141413] text-[#F9F8F6] text-sm font-medium rounded-[4px] hover:bg-[#2A2A28] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Simulate Trade</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* STAGE 3: OUTCOME ENGINE, DECISION REPLAY, REFLECTION, AI REFLECTION & PATTERNS */}
      {step === 'outcome' && activeDecision && (
        <div className="space-y-8">
          {/* Outcome Comparison Card */}
          <section
            aria-label="Outcome Engine"
            className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E6E4DF]">
              <div>
                <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                  OUTCOME ENGINE
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] mt-0.5">
                  Prediction vs. Actual Outcome
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-semibold ${
                    activeDecision.result === 'Correct'
                      ? 'text-[#156F43]'
                      : 'text-[#B4322B]'
                  }`}
                >
                  {activeDecision.result}
                </span>
                <button
                  type="button"
                  onClick={() => setShowReplay((prev) => !prev)}
                  className="px-3.5 py-1.5 font-mono text-xs bg-[#F2F0EC] text-[#141413] rounded-[4px] hover:bg-[#141413] hover:text-[#F9F8F6] transition-colors cursor-pointer"
                >
                  {showReplay ? 'Hide Decision Replay' : 'Open Decision Replay'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-11 gap-6 items-center">
              {/* YOUR DECISION (from immutable snapshot) */}
              <div className="sm:col-span-5 bg-[#F9F8F6] border border-[#E6E4DF] rounded-[4px] p-5">
                <div className="font-mono text-[11px] tracking-[0.1em] text-[#5C5B57]">
                  YOUR DECISION (WHAT YOU KNEW THEN)
                </div>
                <div
                  className={`font-mono text-xl font-semibold mt-2 ${
                    activeDecision.prediction === 'UP'
                      ? 'text-[#156F43]'
                      : 'text-[#B4322B]'
                  }`}
                >
                  {activeDecision.prediction === 'UP' ? '↑ UP' : '↓ DOWN'}
                </div>
                <div className="font-mono tabular-nums text-lg text-[#141413] mt-1">
                  {formatINR(activeDecision.priceAtDecision)}
                </div>
                <div className="text-xs text-[#8A8882] mt-2">
                  {activeDecision.reasoning.join(' · ')} ·{' '}
                  {activeDecision.confidence}% confidence
                </div>
              </div>

              <div className="sm:col-span-1 text-center font-mono text-lg text-[#8A8882]">
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </div>

              {/* WHAT ACTUALLY HAPPENED */}
              <div className="sm:col-span-5 bg-[#F9F8F6] border border-[#E6E4DF] rounded-[4px] p-5">
                <div className="font-mono text-[11px] tracking-[0.1em] text-[#5C5B57]">
                  WHAT ACTUALLY HAPPENED
                </div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#141413] mt-2">
                  {formatINR(activeDecision.outcomePrice)}
                </div>
                <div
                  className={`font-mono tabular-nums text-sm font-medium mt-1 ${
                    activeDecision.outcomeMovePct >= 0
                      ? 'text-[#156F43]'
                      : 'text-[#B4322B]'
                  }`}
                >
                  {activeDecision.outcomeMovePct >= 0 ? '+' : ''}
                  {activeDecision.outcomeMovePct.toFixed(1)}%
                </div>
                <div className="text-xs text-[#8A8882] mt-2">
                  Result:{' '}
                  <strong
                    className={
                      activeDecision.result === 'Correct'
                        ? 'text-[#156F43]'
                        : 'text-[#B4322B]'
                    }
                  >
                    {activeDecision.result}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* SIGNATURE EXPERIENCE: DECISION REPLAY */}
          {showReplay && (
            <DecisionReplayTimeline decision={activeDecision} autoPlay={true} />
          )}

          {/* REFLECTION ENGINE + AI REFLECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Reflection Engine */}
            <section
              aria-label="Reflection Engine"
              className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
            >
              <div className="pb-4 border-b border-[#E6E4DF]">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                  REFLECTION ENGINE
                </span>
                <h3 className="text-lg font-semibold text-[#141413] mt-1">
                  Review Decision Quality
                </h3>
              </div>

              <form onSubmit={handleSaveReflection} className="mt-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#141413] mb-2.5">
                    Was your reasoning responsible for the outcome?
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Yes', 'Partially', 'No'] as AttributionChoice[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setReasoningResponsible(opt);
                            setReflectionSaved(false);
                          }}
                          className={`py-2 px-3 rounded-[4px] text-xs font-medium border transition-colors cursor-pointer ${
                            reasoningResponsible === opt
                              ? 'bg-[#141413] text-[#F9F8F6] border-[#141413]'
                              : 'bg-[#F9F8F6] text-[#5C5B57] border-[#E6E4DF] hover:text-[#141413]'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="change-next-time"
                    className="block text-sm font-medium text-[#141413] mb-2"
                  >
                    What would you change next time?
                  </label>
                  <textarea
                    id="change-next-time"
                    rows={3}
                    value={changeNextTime}
                    onChange={(e) => {
                      setChangeNextTime(e.target.value);
                      setReflectionSaved(false);
                    }}
                    placeholder="Record one concrete adjustment for your next decision..."
                    className="w-full rounded-[4px] border border-[#E6E4DF] bg-[#F9F8F6] px-3.5 py-2.5 text-sm text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#141413] text-[#F9F8F6] text-xs font-medium rounded-[4px] hover:bg-[#2A2A28] transition-colors cursor-pointer"
                  >
                    Save Reflection
                  </button>
                  {reflectionSaved && (
                    <span className="font-mono text-xs text-[#156F43]">
                      Reflection saved to Decision Snapshot
                    </span>
                  )}
                </div>
              </form>
            </section>

            {/* AI Reflection + Derived Pattern & Confidence Calibration Preview */}
            <div className="lg:col-span-6 space-y-6">
              {/* Concise AI Reflection */}
              <section
                aria-label="AI Reflection"
                className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
              >
                <div className="pb-3 border-b border-[#E6E4DF] flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                    AI REFLECTION
                  </span>
                  <span className="font-mono text-[10px] text-[#8A8882]">
                    DECISION CALIBRATION NOTE
                  </span>
                </div>
                <p className="mt-4 text-sm text-[#141413] leading-relaxed">
                  “{activeDecision.reflection?.aiInsight}”
                </p>
              </section>

              {/* Live Derived Decision Pattern & Confidence Calibration */}
              {pattern && (
                <section
                  aria-label="Derived Decision Pattern"
                  className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7"
                >
                  <div className="pb-3 border-b border-[#E6E4DF] flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                      DECISION PATTERN &amp; CALIBRATION
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/progress')}
                      className="font-mono text-xs text-[#141413] underline cursor-pointer"
                    >
                      Full Progress →
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-[#5C5B57]">
                        <strong className="text-[#141413]">
                          {pattern.mostUsedReasoning}
                        </strong>{' '}
                        is your most-used reasoning.
                      </div>
                      <div className="mt-2 space-y-1 font-mono">
                        <div>
                          Accuracy when using {pattern.mostUsedReasoning}:{' '}
                          <strong className="text-[#141413]">
                            {pattern.accuracyUsingReasoning}%
                          </strong>
                        </div>
                        <div>
                          Average confidence:{' '}
                          <strong className="text-[#141413]">
                            {pattern.averageConfidenceUsingReasoning}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="sm:border-l sm:border-[#E6E4DF] sm:pl-4">
                      <div className="text-[#5C5B57]">Confidence Calibration</div>
                      <div className="mt-2 space-y-1 font-mono">
                        <div>
                          Confidence:{' '}
                          <strong className="text-[#141413]">
                            {activeDecision.confidence}%
                          </strong>
                        </div>
                        <div>
                          Actual historical accuracy:{' '}
                          <strong className="text-[#141413]">
                            {calibration.overallAccuracy}%
                          </strong>
                        </div>
                        <div className="pt-1 text-[#141413] font-semibold">
                          {activeDecision.confidence >
                          calibration.overallAccuracy + 6
                            ? 'Confidence > Evidence'
                            : 'Confidence aligned with results'}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Action Bar for Next Decision */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleStartNewDecision}
              className="px-6 py-3 bg-[#141413] text-[#F9F8F6] text-xs font-medium rounded-[4px] hover:bg-[#2A2A28] transition-colors cursor-pointer"
            >
              Make Another Decision →
            </button>

            <button
              type="button"
              onClick={() => navigate('/history')}
              className="px-5 py-3 bg-[#FFFFFF] border border-[#E6E4DF] text-[#141413] text-xs font-medium rounded-[4px] hover:border-[#141413] transition-colors cursor-pointer"
            >
              View All Decisions in History →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
