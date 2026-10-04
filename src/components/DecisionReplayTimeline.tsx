import React, { useEffect, useState } from 'react';
import { Decision } from '../types/decision';
import { formatINR } from '../services/marketDataService';

interface DecisionReplayTimelineProps {
  decision: Decision;
  autoPlay?: boolean;
}

export const DecisionReplayTimeline: React.FC<DecisionReplayTimelineProps> = ({
  decision,
  autoPlay = true,
}) => {
  const [visibleStage, setVisibleStage] = useState<number>(autoPlay ? 1 : 6);

  useEffect(() => {
    if (!autoPlay) {
      setVisibleStage(6);
      return;
    }
    setVisibleStage(1);
    const timers: number[] = [];
    for (let step = 2; step <= 6; step++) {
      const t = window.setTimeout(() => {
        setVisibleStage(step);
      }, (step - 1) * 320);
      timers.push(t);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [decision.id, autoPlay]);

  const handleReplayAgain = () => {
    setVisibleStage(0);
    window.setTimeout(() => {
      setVisibleStage(1);
      for (let step = 2; step <= 6; step++) {
        window.setTimeout(() => {
          setVisibleStage(step);
        }, (step - 1) * 320);
      }
    }, 60);
  };

  const isUp = decision.prediction === 'UP';
  const outcomePositive = decision.outcomeMovePct >= 0;

  const stages = [
    {
      num: '01',
      title: 'BELIEF',
      content: (
        <div
          className={`font-mono text-base font-semibold ${
            isUp ? 'text-[#156F43]' : 'text-[#B4322B]'
          }`}
        >
          {isUp ? '↑ UP' : '↓ DOWN'}
        </div>
      ),
      meta: `Locked at ${decision.createdAt}`,
    },
    {
      num: '02',
      title: 'EVIDENCE',
      content: (
        <div className="space-y-0.5">
          {decision.reasoning.map((r) => (
            <div key={r} className="text-sm font-medium text-[#141413]">
              {r}
            </div>
          ))}
        </div>
      ),
      meta: 'Selected reasoning at entry',
    },
    {
      num: '03',
      title: 'CONFIDENCE',
      content: (
        <div className="font-mono tabular-nums text-xl font-semibold text-[#141413]">
          {decision.confidence}%
        </div>
      ),
      meta: 'Pre-trade conviction',
    },
    {
      num: '04',
      title: 'ACTION',
      content: (
        <div className="space-y-0.5">
          <div className="font-mono text-sm font-semibold text-[#141413]">
            {decision.quantity} {decision.symbol}
          </div>
          <div className="font-mono tabular-nums text-sm text-[#5C5B57]">
            {formatINR(decision.priceAtDecision)}
          </div>
        </div>
      ),
      meta: `Immutable snapshot price · Value ${formatINR(
        decision.quantity * decision.priceAtDecision,
        0
      )}`,
    },
    {
      num: '05',
      title: 'REALITY',
      content: (
        <div className="space-y-0.5">
          <div className="font-mono tabular-nums text-base font-semibold text-[#141413]">
            {formatINR(decision.outcomePrice)}
          </div>
          <div
            className={`font-mono tabular-nums text-xs font-medium ${
              outcomePositive ? 'text-[#156F43]' : 'text-[#B4322B]'
            }`}
          >
            {outcomePositive ? '+' : ''}
            {decision.outcomeMovePct.toFixed(1)}% ({decision.result})
          </div>
        </div>
      ),
      meta: 'Simulated market outcome',
    },
    {
      num: '06',
      title: 'REFLECTION',
      content: decision.reflection ? (
        <div className="space-y-1">
          <div className="text-xs text-[#5C5B57]">
            Reasoning responsible:{' '}
            <strong className="text-[#141413]">
              {decision.reflection.reasoningResponsible}
            </strong>
          </div>
          <div className="text-sm text-[#141413] leading-relaxed">
            “{decision.reflection.changeNextTime || 'Logged for pattern calibration.'}”
          </div>
        </div>
      ) : (
        <div className="text-sm text-[#5C5B57] italic">What did you learn?</div>
      ),
      meta: 'Post-outcome review',
    },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E6E4DF]">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#5C5B57]">
            DECISION REPLAY · TIME CAPSULE
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#141413] mt-0.5">
            {decision.symbol} — What You Knew Then vs. What Happened Later
          </h3>
        </div>

        <button
          type="button"
          onClick={handleReplayAgain}
          className="px-3.5 py-1.5 font-mono text-xs text-[#141413] bg-[#F2F0EC] hover:bg-[#141413] hover:text-[#F9F8F6] rounded-[4px] transition-colors cursor-pointer whitespace-nowrap"
        >
          Replay Sequence ↻
        </button>
      </div>

      {/* Sequential 6-Stage Timeline */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {stages.map((stage, idx) => {
          const stepNumber = idx + 1;
          const isRevealed = visibleStage >= stepNumber;
          return (
            <div
              key={stage.num}
              className={`border-l-2 lg:border-l-0 lg:border-t-2 pl-4 lg:pl-0 lg:pt-4 transition-all duration-300 ${
                isRevealed
                  ? 'opacity-100 translate-y-0 border-[#141413]'
                  : 'opacity-20 translate-y-1 border-[#E6E4DF]'
              }`}
            >
              <div className="font-mono text-[11px] text-[#8A8882]">
                {stage.num}
              </div>
              <div className="font-mono text-xs font-semibold tracking-[0.1em] text-[#5C5B57] mt-0.5 mb-2.5">
                {stage.title}
              </div>

              <div className="min-h-[48px]">{stage.content}</div>

              <div className="text-[11px] text-[#8A8882] mt-2 pt-2 border-t border-[#E6E4DF]">
                {stage.meta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
