import type { TimeRange } from '../types';

const tabs: { label: string; value: TimeRange }[] = [
  { label: '24H', value: 'daily' },
  { label: '7D', value: 'weekly' },
  { label: '30D', value: 'monthly' },
];

export default function Header({ activeRange, onRangeChange }: {
  activeRange: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}) {
  return (
    <header className="border-b border-lite-border bg-lite-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="status-dot" />
        <h1 className="text-xl font-bold tracking-widest glitch-hover">
          <span className="text-neon-cyan glow-cyan">DECK</span>
          <span className="text-neon-magenta glow-magenta">WATCH</span>
        </h1>
        <span className="text-text-muted text-[10px] ml-2 uppercase tracking-wider hidden sm:inline">
          // github intelligence feed
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-text-muted text-[10px] uppercase tracking-wider hidden md:inline animate-flicker">
          ◈ signal active
        </span>
        <nav className="flex gap-0.5 border border-lite-border rounded p-0.5" role="tablist" aria-label="Time range">
          {tabs.map(t => (
            <button
              key={t.value}
              role="tab"
              aria-selected={activeRange === t.value}
              onClick={() => onRangeChange(t.value)}
              className={`px-3 py-1 text-xs tracking-wider transition-all rounded-sm ${
                activeRange === t.value
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-bold'
                  : 'text-text-muted hover:text-text-primary border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
