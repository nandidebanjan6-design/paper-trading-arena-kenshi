import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Decision } from '../types/decision';
import {
  calculateConfidenceCalibration,
  deriveDecisionPatterns,
} from '../services/decisionStorageService';

interface ProgressViewProps {
  decisions: Decision[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({ decisions }) => {
  const navigate = useNavigate();

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

  const calibration = calculateConfidenceCalibration(decisions);
  const pattern = deriveDecisionPatterns(decisions);

  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E6E4DF]">
        <div>
          <span className="font-mono text-[11px] tracking-[0.14em] text-[#5C5B57]">
            DECISION BEHAVIOR &amp; CALIBRATION
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight mt-1">
            Progress
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/lab')}
          className="self-start sm:self-auto px-4 py-2 bg-[#141413] text-[#F9F8F6] text-xs font-medium rounded-[4px] hover:bg-[#2A2A28] transition-colors cursor-pointer"
        >
          New Decision →
        </button>
      </div>

      {/* 4 Core Useful Metrics */}
      <section
        aria-label="Core Decision Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-[#E6E4DF]"
      >
        <div>
          <div className="text-xs text-[#5C5B57]">Decisions</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#141413] mt-1">
            {calibration.totalDecisions}
          </div>
        </div>

        <div>
          <div className="text-xs text-[#5C5B57]">Accuracy</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#141413] mt-1">
            {calibration.overallAccuracy}%
          </div>
        </div>

        <div>
          <div className="text-xs text-[#5C5B57]">Average Confidence</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#141413] mt-1">
            {calibration.averageConfidence}%
          </div>
        </div>

        <div>
          <div className="text-xs text-[#5C5B57]">Reflection Rate</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#141413] mt-1">
            {calibration.reflectionRate}%
          </div>
        </div>
      </section>

      {/* Confidence Calibration & Pattern Detection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Confidence vs Accuracy Visualization */}
        <section
          aria-label="Confidence Calibration"
          className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7 space-y-6"
        >
          <div className="pb-4 border-b border-[#E6E4DF] flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                CONFIDENCE CALIBRATION
              </span>
              <h2 className="text-lg font-semibold text-[#141413] mt-1">
                Confidence vs Accuracy
              </h2>
            </div>

            <span className="font-mono text-xs font-semibold text-[#141413]">
              {calibration.calibrationStatus}
            </span>
          </div>

          {/* Overall Comparison Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#5C5B57]">Confidence</span>
                <span className="font-mono tabular-nums font-semibold text-[#141413]">
                  {calibration.averageConfidence}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F2F0EC] rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-[#141413] transition-all duration-500"
                  style={{ width: `${calibration.averageConfidence}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#5C5B57]">
                  Actual historical accuracy
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#156F43]">
                  {calibration.overallAccuracy}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F2F0EC] rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-[#156F43] transition-all duration-500"
                  style={{ width: `${calibration.overallAccuracy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reasoning Factor Breakdown */}
          {pattern && (
            <div className="pt-5 border-t border-[#E6E4DF] space-y-3">
              <div className="font-mono text-[11px] text-[#8A8882]">
                CALIBRATION BY REASONING EVIDENCE
              </div>
              <div className="divide-y divide-[#E6E4DF]">
                {pattern.allReasoningStats.map((item) => (
                  <div
                    key={item.factor}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-[#141413] text-sm">
                        {item.factor}
                      </span>
                      <span className="font-mono text-[#8A8882] ml-2">
                        ({item.count} {item.count === 1 ? 'decision' : 'decisions'})
                      </span>
                    </div>

                    <div className="flex items-center gap-6 font-mono tabular-nums">
                      <div>
                        <span className="text-[#8A8882] mr-1.5">Confidence:</span>
                        <span className="text-[#141413] font-medium">
                          {item.avgConfidence}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8A8882] mr-1.5">Accuracy:</span>
                        <span
                          className={`font-semibold ${
                            item.accuracy >= 60
                              ? 'text-[#156F43]'
                              : 'text-[#B4322B]'
                          }`}
                        >
                          {item.accuracy}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Derived Pattern Detection Card */}
        {pattern && (
          <section
            aria-label="Decision Pattern"
            className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E4DF] rounded-[6px] p-5 sm:p-7 space-y-5"
          >
            <div className="pb-4 border-b border-[#E6E4DF]">
              <span className="font-mono text-[11px] tracking-[0.12em] text-[#5C5B57]">
                DERIVED INSIGHT
              </span>
              <h2 className="text-lg font-semibold text-[#141413] mt-1">
                Decision Pattern
              </h2>
            </div>

            <p className="text-sm text-[#141413] leading-relaxed">
              <strong>{pattern.mostUsedReasoning}</strong> is your most-used
              reasoning.
            </p>

            <div className="space-y-3 pt-2 border-t border-[#E6E4DF] text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-[#5C5B57]">
                  Accuracy when using {pattern.mostUsedReasoning}
                </span>
                <span className="font-mono tabular-nums text-lg font-semibold text-[#141413]">
                  {pattern.accuracyUsingReasoning}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[#5C5B57]">Average confidence</span>
                <span className="font-mono tabular-nums text-lg font-semibold text-[#141413]">
                  {pattern.averageConfidenceUsingReasoning}%
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F9F8F6] border border-[#E6E4DF] rounded-[4px] text-xs text-[#5C5B57] leading-relaxed">
              {pattern.averageConfidenceUsingReasoning >
              pattern.accuracyUsingReasoning + 6
                ? `Your average confidence (${pattern.averageConfidenceUsingReasoning}%) when trading on ${pattern.mostUsedReasoning} exceeds your realized accuracy (${pattern.accuracyUsingReasoning}%). Consider moderating conviction until secondary evidence aligns.`
                : `Your confidence (${pattern.averageConfidenceUsingReasoning}%) when using ${pattern.mostUsedReasoning} is well-calibrated with your realized accuracy (${pattern.accuracyUsingReasoning}%).`}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
