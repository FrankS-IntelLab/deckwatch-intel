import { useState } from 'react';
import { useHistory, type HistoryEntry } from '../context/HistoryContext';

const sourceColors: Record<string, string> = {
  chat: 'text-neon-cyan',
  report: 'text-neon-magenta',
  popup: 'text-neon-green',
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPanel() {
  const { entries } = useHistory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...entries].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {sorted.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">// no history yet — start chatting</p>
        )}
        <div className="grid gap-1.5">
          {sorted.map(entry => (
            <EntryCard key={entry.id} entry={entry} expanded={expanded === entry.id} onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, expanded, onToggle }: { entry: HistoryEntry; expanded: boolean; onToggle: () => void }) {
  const userMsgs = entry.messages.filter(m => m.role === 'user');
  const assistantMsgs = entry.messages.filter(m => m.role === 'assistant');
  const preview = userMsgs[0]?.content.slice(0, 80) || assistantMsgs[0]?.content.slice(0, 80) || '...';

  return (
    <div className={`t-card t-border border rounded overflow-hidden ${expanded ? 'border-neon-cyan/20' : ''}`}>
      <button onClick={onToggle} className="w-full px-3 py-2 text-left flex items-center gap-2 hover:opacity-80 transition-colors">
        <span className={`text-[10px] uppercase font-bold ${sourceColors[entry.source] || 'text-text-muted'}`}>
          {entry.source}
        </span>
        <span className="text-xs truncate flex-1">{entry.label}</span>
        <span className="text-text-muted text-[10px] shrink-0">{formatTime(entry.timestamp)}</span>
        <span className="text-text-muted text-[10px]">{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 t-border border-t space-y-2 max-h-[200px] overflow-y-auto">
          {entry.messages.filter(m => m.role !== 'system').map((m, i) => (
            <div key={i} className={`text-xs mt-2 ${m.role === 'user' ? 'text-right' : ''}`}>
              <span className={`text-[10px] ${m.role === 'user' ? 'text-neon-cyan' : 'text-text-muted'}`}>
                {m.role === 'user' ? 'you' : 'ai'}:
              </span>
              <p className={`whitespace-pre-wrap leading-relaxed mt-0.5 ${m.role === 'user' ? '' : 'text-text-muted'}`}>
                {m.content}
              </p>
            </div>
          ))}
          {!preview && <p className="text-text-muted text-xs">// empty conversation</p>}
        </div>
      )}
    </div>
  );
}
