import { useState, useEffect } from 'react';
import type { TimeRange, GitHubRepo } from './types';
import { fetchTrending, fetchOrgRepos, TITANS } from './api/github';
import Header from './components/Header';
import TitansPanel from './components/TitansPanel';
import UndergroundPanel from './components/UndergroundPanel';
import ChatPanel from './components/ChatPanel';
import ReportGenerator from './components/ReportGenerator';
import SettingsModal from './components/SettingsModal';
import './index.css';

type AITab = 'chat' | 'report';

export default function App() {
  const [range, setRange] = useState<TimeRange>('weekly');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiTab, setAiTab] = useState<AITab>('chat');
  const [aiOpen, setAiOpen] = useState(false);
  const [allRepos, setAllRepos] = useState<GitHubRepo[]>([]);

  const rangeLabel = { daily: 'Last 24h', weekly: 'Last 7 days', monthly: 'Last 30 days' }[range];

  // Collect repos for AI context
  useEffect(() => {
    Promise.all([
      fetchTrending(range, 15),
      ...TITANS.map(t => fetchOrgRepos(t.github, 5)),
    ]).then(results => setAllRepos(results.flat()))
      .catch(() => {});
  }, [range]);

  return (
    <div className="min-h-screen bg-lite-bg flex flex-col">
      <Header activeRange={range} onRangeChange={setRange}>
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-2 py-1 text-xs text-text-muted hover:text-neon-cyan transition-colors"
          aria-label="Settings"
        >⚙</button>
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className={`px-3 py-1 text-xs rounded transition-colors border ${
            aiOpen
              ? 'text-neon-magenta border-neon-magenta/30 bg-neon-magenta/10'
              : 'text-text-muted border-transparent hover:text-neon-magenta'
          }`}
        >
          ◈ AI
        </button>
      </Header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TitansPanel />
        <UndergroundPanel range={range} />
      </main>

      {/* AI Drawer */}
      {aiOpen && (
        <div className="border-t border-lite-border bg-lite-card h-[400px] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-lite-border">
            <span className="text-neon-magenta text-xs font-bold tracking-widest glow-magenta">◈ AI INTEL</span>
            <div className="flex gap-0.5 ml-4 border border-lite-border rounded p-0.5">
              {(['chat', 'report'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAiTab(t)}
                  className={`px-3 py-1 text-[11px] rounded-sm transition-colors ${
                    aiTab === t
                      ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  {t === 'chat' ? 'Chat' : 'Report'}
                </button>
              ))}
            </div>
            <span className="text-text-muted text-[10px] ml-auto">{rangeLabel} • {allRepos.length} repos loaded</span>
            <button onClick={() => setAiOpen(false)} className="text-text-muted hover:text-text-primary text-sm ml-2">✕</button>
          </div>
          <div className="flex-1 min-h-0">
            {aiTab === 'chat'
              ? <ChatPanel repos={allRepos} label={rangeLabel} />
              : <ReportGenerator repos={allRepos} label={rangeLabel} />
            }
          </div>
        </div>
      )}

      <footer className="text-center py-4 border-t border-lite-border">
        <p className="text-text-muted text-[10px] uppercase tracking-[0.3em]">
          DeckWatch Intel v0.1 — the net never sleeps
        </p>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
