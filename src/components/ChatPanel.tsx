import { useState, useRef, useEffect } from 'react';
import type { GitHubRepo } from '../types';
import type { ChatMessage } from '../api/llm';
import { chatCompletion } from '../api/llm';

function buildSystemPrompt(repos: GitHubRepo[], label: string): string {
  const summary = repos.map(r =>
    `- ${r.full_name}: ★${r.stargazers_count} | ${r.language || 'N/A'} | ${r.description || 'no desc'}`
  ).join('\n');
  return `You are DeckWatch Intel AI, a cyberpunk-themed GitHub intelligence analyst. You speak concisely with a slight edge.

Current data context — ${label}:
${summary}

Answer questions about these repos, trends, and what's happening in the community. Be insightful and opinionated.`;
}

export default function ChatPanel({ repos, label }: { repos: GitHubRepo[]; label: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const system: ChatMessage = { role: 'system', content: buildSystemPrompt(repos, label) };
      const reply = await chatCompletion([system, ...history]);
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-text-muted text-xs text-center py-8">
            // ask me anything about the current feed
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block max-w-[85%] px-3 py-2 rounded text-left ${
              m.role === 'user'
                ? 'bg-neon-cyan/10 text-text-primary border border-neon-cyan/20'
                : 'bg-lite-surface text-text-primary border border-lite-border'
            }`}>
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-neon-cyan text-xs animate-pulse">◌ processing...</div>
        )}
        {error && (
          <div className="text-red-600 text-xs border border-red-300 rounded px-3 py-2 bg-red-50">⚠ {error}</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-lite-border p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about the feed..."
          className="flex-1 bg-lite-surface border border-lite-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-cyan/50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-2 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
