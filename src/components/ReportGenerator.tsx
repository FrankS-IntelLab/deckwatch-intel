import { useState } from 'react';
import type { GitHubRepo } from '../types';
import { chatCompletion } from '../api/llm';

function buildPrompt(repos: GitHubRepo[], label: string, platform: 'rednote' | 'reddit'): string {
  const summary = repos.map(r =>
    `- ${r.full_name}: ★${r.stargazers_count} forks:${r.forks_count} | ${r.language || 'N/A'} | ${r.description || 'no desc'}`
  ).join('\n');

  const platformGuide = platform === 'rednote'
    ? 'Format for 小红书 (RedNote): Use Chinese. Include emoji. Keep it engaging and visual. Use bullet points. Add relevant hashtags at the end.'
    : 'Format for Reddit: Use English. Write a concise, informative post. Use markdown headers and bullet points. Add a TL;DR at the top.';

  return `You are a tech content writer. Generate a social media post summarizing GitHub trends.

${platformGuide}

Data — ${label}:
${summary}

Write the post now. Make it insightful, highlight the most interesting repos and patterns.`;
}

export default function ReportGenerator({ repos, label }: { repos: GitHubRepo[]; label: string }) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<'rednote' | 'reddit'>('reddit');
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError('');
    setReport('');
    try {
      const result = await chatCompletion([
        { role: 'system', content: 'You are a skilled tech content writer.' },
        { role: 'user', content: buildPrompt(repos, label, platform) },
      ]);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
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
      <div className="p-4 border-b border-lite-border flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 border border-lite-border rounded p-0.5">
          {(['reddit', 'rednote'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                platform === p
                  ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30'
                  : 'text-text-muted hover:text-text-primary border border-transparent'
              }`}
            >
              {p === 'reddit' ? 'Reddit' : '小红书'}
            </button>
          ))}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors disabled:opacity-40"
        >
          {loading ? '◌ Generating...' : '▸ Generate Report'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {!report && !error && !loading && (
          <p className="text-text-muted text-xs text-center py-8">
            // select platform and generate a report from the current feed
          </p>
        )}
        {loading && (
          <div className="text-neon-magenta text-xs animate-pulse py-8 text-center">
            ◌ compiling intelligence report...
          </div>
        )}
        {error && (
          <div className="text-red-600 text-xs border border-red-300 rounded px-3 py-2 bg-red-50">⚠ {error}</div>
        )}
        {report && (
          <div className="bg-lite-surface border border-lite-border rounded p-4">
            <pre className="whitespace-pre-wrap text-xs text-text-primary leading-relaxed">{report}</pre>
          </div>
        )}
      </div>

      {report && (
        <div className="border-t border-lite-border p-3 flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-1.5 text-xs text-neon-green border border-neon-green/30 rounded bg-neon-green/10 hover:bg-neon-green/20 transition-colors"
          >
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
          <button
            onClick={exportMarkdown}
            className="px-4 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors"
          >
            ↓ Export .md
          </button>
        </div>
      )}
    </div>
  );
}
