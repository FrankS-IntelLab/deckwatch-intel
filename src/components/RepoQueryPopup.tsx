import { useState, useRef, useEffect } from 'react';
import type { GitHubRepo } from '../types';
import type { ChatMessage } from '../api/llm';
import { chatCompletion } from '../api/llm';
import type { PopupSide } from '../context/RepoPopupContext';
import { useHistory } from '../context/HistoryContext';

export default function RepoQueryPopup({ repo, side, onClose }: { repo: GitHubRepo; side: PopupSide; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { addEntry } = useHistory();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const systemPrompt = `You are DeckWatch Intel AI. Answer questions about this specific GitHub repo concisely:
- Name: ${repo.full_name}
- Description: ${repo.description || 'none'}
- Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}
- Language: ${repo.language || 'N/A'}
- URL: ${repo.html_url}
- Last pushed: ${repo.pushed_at}`;

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatCompletion([{ role: 'system', content: systemPrompt }, ...history]);
      const updated = [...history, { role: 'assistant' as const, content: reply }];
      setMessages(updated);
      addEntry({ source: 'popup', label: repo.full_name, messages: updated });
    } catch (e) {
      setMessages([...history, { role: 'assistant', content: `⚠ ${e instanceof Error ? e.message : 'Error'}` }]);
    } finally { setLoading(false); }
  }

  const posClass = side === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`fixed top-16 ${posClass} z-[90] w-[380px] h-[420px] t-card t-border border rounded-lg shadow-xl flex flex-col`}>
      <div className="flex items-center gap-2 px-3 py-2 t-border border-b shrink-0">
        <img src={repo.owner.avatar_url} alt="" className="w-5 h-5 rounded" />
        <span className="text-xs font-semibold text-neon-cyan truncate flex-1">{repo.full_name}</span>
        <span className={`text-[9px] uppercase tracking-wider ${side === 'left' ? 'text-neon-magenta' : 'text-neon-green'}`}>
          {side === 'left' ? 'megacorp' : 'street'}
        </span>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-sm ml-1">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">// ask anything about this repo</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block max-w-[85%] px-3 py-2 rounded text-left ${
              m.role === 'user' ? 'bg-neon-cyan/10 border border-neon-cyan/20' : 't-surface t-border border'
            }`}>
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && <div className="text-neon-cyan text-xs animate-pulse">◌ processing...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="t-border border-t p-2 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about this repo..."
          className="flex-1 t-surface t-border border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-neon-cyan/50"
          autoFocus
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-3 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors disabled:opacity-40"
        >Send</button>
      </div>
    </div>
  );
}
