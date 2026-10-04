/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Decision, MarketQuote } from './types/decision';
import { fetchMarketQuotes } from './services/marketDataService';
import {
  loadDecisions,
  loadVirtualBalance,
  saveDecisions,
  saveVirtualBalance,
} from './services/decisionStorageService';
import { TopNav } from './components/TopNav';
import { HomeView } from './components/HomeView';
import { DecisionLabView } from './components/DecisionLabView';
import { HistoryView } from './components/HistoryView';
import { ProgressView } from './components/ProgressView';

export default function App() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState<string>('TCS');
  const [decisions, setDecisions] = useState<Decision[]>(() => loadDecisions());
  const [balance, setBalance] = useState<number>(() => loadVirtualBalance());

  const loadMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketQuotes(false);
      setQuotes(res.quotes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Market data unavailable'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  const handleSaveDecision = (newDecision: Decision) => {
    setDecisions((prev) => {
      const updated = [newDecision, ...prev];
      saveDecisions(updated);
      return updated;
    });

    // Update virtual balance based on simulated trade outcome delta
    const priceDiff = newDecision.outcomePrice - newDecision.priceAtDecision;
    const rawDelta = priceDiff * newDecision.quantity;
    const signedDelta =
      newDecision.prediction === 'UP' ? rawDelta : -rawDelta;
    setBalance((prev) => {
      const next = Math.round(prev + signedDelta);
      saveVirtualBalance(next);
      return next;
    });
  };

  const handleUpdateDecision = (updatedDecision: Decision) => {
    setDecisions((prev) => {
      const updated = prev.map((d) =>
        d.id === updatedDecision.id ? updatedDecision : d
      );
      saveDecisions(updated);
      return updated;
    });
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#141413]">
        <TopNav balance={balance} />

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route
              path="/"
              element={
                <HomeView
                  quotes={quotes}
                  loading={loading}
                  error={error}
                  onRetry={loadMarketData}
                  onSelectSymbolForLab={setSelectedSymbol}
                />
              }
            />
            <Route
              path="/lab"
              element={
                <DecisionLabView
                  quotes={quotes}
                  loading={loading}
                  error={error}
                  onRetry={loadMarketData}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  decisions={decisions}
                  onSaveDecision={handleSaveDecision}
                  onUpdateDecision={handleUpdateDecision}
                />
              }
            />
            <Route
              path="/history"
              element={<HistoryView decisions={decisions} />}
            />
            <Route
              path="/progress"
              element={<ProgressView decisions={decisions} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
