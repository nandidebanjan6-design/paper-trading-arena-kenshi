import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Decision } from '../types/decision';
import { formatINR } from '../services/marketDataService';
import { DecisionReplayTimeline } from './DecisionReplayTimeline';
import { MiniPriceChart } from './MiniPriceChart';

interface HistoryViewProps {
  decisions: Decision[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ decisions }) => {
  const navigate = useNavigate();
  const [replayDecisionId, setReplayDecisionId] = useState<string | null>(
    decisions[0]?.id || null
  );

  const activeReplayDecision =
    decisions.find((d) => d.id === replayDecisionId) || decisions[0] || null;

  if (decisions.length === 0) {
    return (
      <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-20 text-center">
        <p className="text-base text-[#141413] font-medium mb-4">
          Your first decision hasn&apos;t been made yet.
        </p>
        <button
          type="button"
          onClick={() => navigate('/lab')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#141413] text-[#F9F8F6] text-xs font-medium rounded-[4px] hover:bg-[#2A2A28] transition-colors cursor-pointer"
        >
          <span>Enter Decision Lab</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E6E4DF]">
        <div>
          <span className="font-mono text-[11px] tracking-[0.14em] text-[#5C5B57]">
            DECISION ARCHIVE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight mt-1">
            History
          </h1>
        </div>
        <p className="text-xs text-[#5C5B57]">
          Every row preserves the immutable snapshot of what you believed at the moment of decision.
        </p>
      </div>

      {/* Decision List */}
      <div className="bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] divide-y divide-[#E6E4DF]">
        {decisions.map((d) => {
          const isSelected = activeReplayDecision?.id === d.id;
          const isUp = d.prediction === 'UP';
          const isCorrect = d.result === 'Correct';

          return (
            <div
              key={d.id}
              className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isSelected ? 'bg-[#F2F0EC]/70' : 'hover:bg-[#F9F8F6]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-base font-semibold text-[#141413] w-24">
                  {d.symbol}
                </span>

                <span
                  className={`font-mono text-sm font-semibold w-20 ${
                    isUp ? 'text-[#156F43]' : 'text-[#B4322B]'
                  }`}
                >
                  {isUp ? '↑ UP' : '↓ DOWN'}
                </span>

                <span className="font-mono tabular-nums text-sm text-[#141413]">
                  {d.confidence}% confidence
                </span>

                <span className="text-xs text-[#5C5B57]">
                  {d.reasoning.join(' · ')}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <span
                  className={`font-mono text-xs font-semibold ${
                    isCorrect ? 'text-[#156F43]' : 'text-[#B4322B]'
                  }`}
                >
                  {d.result}
                </span>

                <button
                  type="button"
                  onClick={() => setReplayDecisionId(d.id)}
                  className={`px-3.5 py-1.5 rounded-[4px] font-mono text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#141413] text-[#F9F8F6]'
                      : 'bg-[#F2F0EC] text-[#141413] hover:bg-[#141413] hover:text-[#F9F8F6]'
                  }`}
                >
                  Replay →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reconstructed Decision Replay & Snapshot Comparison */}
      {activeReplayDecision && (
        <div className="space-y-6 pt-2">
          <DecisionReplayTimeline
            decision={activeReplayDecision}
            autoPlay={true}
          />

          {/* Time Capsule Comparison: What I Knew Then vs What Happened Later */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-6">
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57] pb-3 border-b border-[#E6E4DF]">
                WHAT I KNEW THEN · SNAPSHOT AT {activeReplayDecision.createdAt}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8A8882] block">Price at decision</span>
                  <span className="font-mono tabular-nums text-base font-semibold text-[#141413] mt-0.5 inline-block">
                    {formatINR(activeReplayDecision.priceAtDecision)}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8882] block">Belief &amp; Confidence</span>
                  <span className="font-mono text-base font-semibold text-[#141413] mt-0.5 inline-block">
                    {activeReplayDecision.prediction === 'UP' ? '↑ UP' : '↓ DOWN'} ·{' '}
                    {activeReplayDecision.confidence}%
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#8A8882] block">Evidence Selected</span>
                  <span className="text-sm font-medium text-[#141413] mt-0.5 inline-block">
                    {activeReplayDecision.reasoning.join(' · ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E6E4DF]">
                <MiniPriceChart
                  points={activeReplayDecision.snapshotPriceSeries}
                  isPositive={activeReplayDecision.prediction === 'UP'}
                  height={96}
                />
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-6 space-y-4">
              <div className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57] pb-3 border-b border-[#E6E4DF]">
                WHAT HAPPENED LATER · OUTCOME &amp; REFLECTION
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8A8882] block">Outcome Price</span>
                  <span className="font-mono tabular-nums text-base font-semibold text-[#141413] mt-0.5 inline-block">
                    {formatINR(activeReplayDecision.outcomePrice)} (
                    {activeReplayDecision.outcomeMovePct >= 0 ? '+' : ''}
                    {activeReplayDecision.outcomeMovePct.toFixed(1)}%)
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8882] block">Evaluation</span>
                  <span
                    className={`font-mono text-base font-semibold mt-0.5 inline-block ${
                      activeReplayDecision.result === 'Correct'
                        ? 'text-[#156F43]'
                        : 'text-[#B4322B]'
                    }`}
                  >
                    {activeReplayDecision.result}
                  </span>
                </div>
              </div>

              {activeReplayDecision.reflection && (
                <div className="pt-3 border-t border-[#E6E4DF] space-y-3 text-xs">
                  <div>
                    <span className="text-[#8A8882] block">
                      Was reasoning responsible?
                    </span>
                    <span className="font-medium text-[#141413] mt-0.5 inline-block">
                      {activeReplayDecision.reflection.reasoningResponsible}
                    </span>
                  </div>
                  {activeReplayDecision.reflection.changeNextTime && (
                    <div>
                      <span className="text-[#8A8882] block">
                        What to change next time
                      </span>
                      <p className="text-[#141413] mt-0.5 leading-relaxed">
                        “{activeReplayDecision.reflection.changeNextTime}”
                      </p>
                    </div>
                  )}
                  {activeReplayDecision.reflection.aiInsight && (
                    <div className="p-3.5 bg-[#F9F8F6] border border-[#E6E4DF] rounded-[4px]">
                      <span className="font-mono text-[10px] text-[#8A8882] block mb-1">
                        AI REFLECTION INSIGHT
                      </span>
                      <p className="text-[#5C5B57] leading-relaxed">
                        {activeReplayDecision.reflection.aiInsight}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
