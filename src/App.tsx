import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [dark, setDark] = useState(() => localStorage.getItem('dw_theme') === 'dark');
  const [aiHeight, setAiHeight] = useState(() => Number(localStorage.getItem('dw_ai_height')) || 280);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const rangeLabel = { daily: 'Last 24h', weekly: 'Last 7 days', monthly: 'Last 30 days' }[range];

  useEffect(() => {
    document.body.classList.toggle('theme-dark', dark);
    localStorage.setItem('dw_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    Promise.allSettled([
      fetchTrending(range, 15),
      ...TITANS.map(t => fetchOrgRepos(t.github, 5)),
    ]).then(results => setAllRepos(
      results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
    ));
  }, [range]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = aiHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [aiHeight]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = startY.current - e.clientY;
      const newH = Math.min(Math.max(startH.current + delta, 150), window.innerHeight - 120);
      setAiHeight(newH);
    }
    function onMouseUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('dw_ai_height', String(aiHeight));
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [aiHeight]);

  return (
    <div className="h-screen flex flex-col t-bg">
      <Header activeRange={range} onRangeChange={setRange} dark={dark} onToggleTheme={() => setDark(!dark)}>
        <button onClick={() => setSettingsOpen(true)} className="px-2 py-1 text-xs text-text-muted hover:text-neon-cyan transition-colors" aria-label="Settings">⚙</button>
        <button onClick={() => setAiOpen(!aiOpen)}
          className={`px-3 py-1 text-xs rounded transition-colors border ${aiOpen ? 'text-neon-magenta border-neon-magenta/30 bg-neon-magenta/10' : 'text-text-muted border-transparent hover:text-neon-magenta'}`}
        >◈ AI</button>
      </Header>

      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TitansPanel timeRange={rangeLabel} />
        <UndergroundPanel range={range} timeRange={rangeLabel} />
      </main>

      {aiOpen && (
        <div className="t-card t-border border-t shrink-0 flex flex-col" style={{ height: aiHeight }}>
          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="h-2 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-neon-cyan/10 transition-colors group"
            title="Drag to resize"
          >
            <div className="w-10 h-0.5 rounded-full bg-text-muted/30 group-hover:bg-neon-cyan/50 transition-colors" />
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 t-border border-b shrink-0">
            <span className="text-neon-magenta text-xs font-bold tracking-widest glow-magenta">◈ AI INTEL</span>
            <div className="flex gap-0.5 ml-3 t-border border rounded p-0.5">
              {(['chat', 'report'] as const).map(t => (
                <button key={t} onClick={() => setAiTab(t)}
                  className={`px-3 py-0.5 text-[11px] rounded-sm transition-colors ${aiTab === t ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
                >{t === 'chat' ? 'Chat' : 'Report'}</button>
              ))}
            </div>
            <span className="text-text-muted text-[10px] ml-auto">{rangeLabel} • {allRepos.length} repos</span>
            <button onClick={() => setAiOpen(false)} className="text-text-muted hover:text-text-primary text-sm ml-2">✕</button>
          </div>
          <div className="flex-1 min-h-0">
            {aiTab === 'chat' ? <ChatPanel repos={allRepos} label={rangeLabel} /> : <ReportGenerator repos={allRepos} label={rangeLabel} />}
          </div>
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
