import { useState } from 'react';
import type { TimeRange } from './types';
import Header from './components/Header';
import TitansPanel from './components/TitansPanel';
import UndergroundPanel from './components/UndergroundPanel';
import './index.css';

export default function App() {
  const [range, setRange] = useState<TimeRange>('weekly');

  return (
    <div className="min-h-screen bg-lite-bg">
      <Header activeRange={range} onRangeChange={setRange} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TitansPanel />
        <UndergroundPanel range={range} />
      </main>
      <footer className="text-center py-6 border-t border-lite-border">
        <p className="text-text-muted text-[10px] uppercase tracking-[0.3em]">
          DeckWatch Intel v0.1 — the net never sleeps
        </p>
      </footer>
    </div>
  );
}
