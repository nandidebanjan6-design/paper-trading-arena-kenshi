import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketQuote } from '../types/decision';
import { formatINR } from '../services/marketDataService';

interface HomeViewProps {
  quotes: MarketQuote[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectSymbolForLab: (symbol: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  quotes,
  loading,
  error,
  onRetry,
  onSelectSymbolForLab,
}) => {
  const navigate = useNavigate();

  const handleEnterLab = (symbol?: string) => {
    if (symbol) {
      onSelectSymbolForLab(symbol);
    }
    navigate('/lab');
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Main Quiet Centered Editorial Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16 sm:py-24 text-center max-w-[780px] mx-auto w-full">
        <div className="font-mono text-[11px] tracking-[0.14em] text-[#8A8882] mb-5">
          LEARN → PREDICT → JUSTIFY → TRADE → REVIEW → IMPROVE
        </div>

        <h1 className="font-serif text-[48px] sm:text-[68px] lg:text-[76px] leading-[1.02] tracking-[-0.02em] text-[#141413] text-balance">
          Trade. Think. Learn.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#5C5B57] leading-[1.6] max-w-[46ch]">
          A paper-trading simulator that records the decision behind every trade.
        </p>

        <div className="mt-8 sm:mt-10">
          <button
            type="button"
            onClick={() => handleEnterLab()}
            className="inline-flex items-center justify-center gap-3 bg-[#141413] text-[#F9F8F6] px-7 py-3.5 text-sm font-medium rounded-[4px] hover:bg-[#2A2A28] active:scale-[0.99] transition-all duration-150 cursor-pointer whitespace-nowrap"
          >
            <span>Enter Decision Lab</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E6E4DF] w-full max-w-[520px] text-center">
          <p className="text-xs sm:text-[13px] text-[#8A8882] tracking-tight">
            We don&apos;t just record what you traded.{' '}
            <span className="text-[#141413] font-medium">
              We record what you believed.
            </span>
          </p>
        </div>
      </div>

      {/* Underneath Simple Market Strip */}
      <footer
        aria-label="Sample Market Strip"
        className="w-full border-t border-[#E6E4DF] bg-[#F2F0EC]/50"
      >
        <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-4">
          {loading ? (
            <div className="flex flex-wrap items-center justify-center gap-8 py-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 w-44 bg-[#E6E4DF] rounded animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-4 text-xs text-[#B4322B]">
              <span>Market data unavailable</span>
              <button
                type="button"
                onClick={onRetry}
                className="underline font-medium text-[#141413] cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-2 w-full sm:w-auto">
                {quotes.map((q) => {
                  const isUp = q.changePct >= 0;
                  return (
                    <button
                      key={q.symbol}
                      type="button"
                      onClick={() => handleEnterLab(q.symbol)}
                      className="flex items-center gap-2.5 text-left hover:opacity-75 transition-opacity cursor-pointer py-0.5"
                    >
                      <span className="font-mono text-xs font-semibold text-[#141413]">
                        {q.symbol}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-[#5C5B57]">
                        {formatINR(q.price)}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-xs font-medium ${
                          isUp ? 'text-[#156F43]' : 'text-[#B4322B]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {q.changePct.toFixed(2)}%
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="font-mono text-[11px] text-[#8A8882] flex items-center gap-1.5 shrink-0">
                <span className="text-[#156F43] text-[9px]">●</span>
                <span>SAMPLE MARKET DATA</span>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
