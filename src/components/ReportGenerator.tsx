import { useState } from 'react';
import Markdown from 'react-markdown';
import type { GitHubRepo } from '../types';
import { chatCompletion } from '../api/llm';
import { useHistory } from '../context/HistoryContext';

function buildPrompt(repos: GitHubRepo[], label: string, platform: 'rednote' | 'reddit'): string {
  const summary = repos.map(r =>
    `- ${r.full_name}: ★${r.stargazers_count} forks:${r.forks_count} | ${r.language || 'N/A'} | ${r.description || 'no desc'}`
  ).join('\n');
  const guide = platform === 'rednote'
    ? 'Format for 小红书 (RedNote): Use Chinese. Include emoji. Keep it engaging and visual. Use bullet points. Add relevant hashtags at the end.'
    : 'Format for Reddit: Use English. Write a concise, informative post. Use markdown headers and bullet points. Add a TL;DR at the top.';
  return `You are a tech content writer. Generate a social media post summarizing GitHub trends.\n\n${guide}\n\nData — ${label}:\n${summary}\n\nWrite the post now. Make it insightful, highlight the most interesting repos and patterns.`;
}

export default function ReportGenerator({ repos, label }: { repos: GitHubRepo[]; label: string }) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<'rednote' | 'reddit'>('reddit');
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);
  const { addEntry } = useHistory();

  async function generate() {
    setLoading(true); setError(''); setReport('');
    try {
      const result = await chatCompletion([
        { role: 'system', content: 'You are a skilled tech content writer.' },
        { role: 'user', content: buildPrompt(repos, label, platform) },
      ]);
      setReport(result);
      addEntry({ source: 'report', label: `Report — ${platform === 'reddit' ? 'Reddit' : '小红书'} — ${label}`, messages: [{ role: 'user', content: `Generate ${platform} report for ${label}` }, { role: 'assistant', content: result }] });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportMarkdown() {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deckwatch-report-${platform}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 t-border border-b flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex gap-0.5 t-border border rounded p-0.5">
          {(['reddit', 'rednote'] as const).map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-sm transition-colors ${platform === p ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
            >{p === 'reddit' ? 'Reddit' : '小红书'}</button>
          ))}
        </div>
        <button onClick={generate} disabled={loading}
          className="px-4 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors disabled:opacity-40"
        >{loading ? '◌ Generating...' : '▸ Generate Report'}</button>
        {report && <>
          <button onClick={() => setViewRaw(!viewRaw)}
            className="px-3 py-1.5 text-xs text-text-muted t-border border rounded hover:text-text-primary transition-colors"
          >{viewRaw ? '◉ Rendered' : '◎ Raw MD'}</button>
          <button onClick={copyToClipboard} className="px-3 py-1.5 text-xs text-neon-green border border-neon-green/30 rounded bg-neon-green/10 hover:bg-neon-green/20 transition-colors ml-auto">
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
          <button onClick={exportMarkdown} className="px-3 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors">↓ .md</button>
        </>}
      </div>
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {!report && !error && !loading && <p className="text-text-muted text-xs text-center py-4">// select platform and generate a report</p>}
        {loading && <div className="text-neon-magenta text-xs animate-pulse py-4 text-center">◌ compiling intelligence report...</div>}
        {error && <div className="text-red-600 text-xs border border-red-300 rounded px-3 py-2">⚠ {error}</div>}
        {report && (
          viewRaw
            ? <pre className="t-surface t-border border rounded p-3 whitespace-pre-wrap text-xs leading-relaxed">{report}</pre>
            : <div className="t-surface t-border border rounded p-4 prose-cyber">
                <Markdown>{report}</Markdown>
              </div>
        )}
      </div>
    </div>
  );
}
