import { useEffect, useState } from 'react';
import type { GitHubRepo, TimeRange } from '../types';
import { fetchTrending } from '../api/github';
import RepoCard from './RepoCard';
import { exportReposAsMarkdown } from '../utils/export';

export default function UndergroundPanel({ range, timeRange }: { range: TimeRange; timeRange: string }) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchTrending(range)
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <section className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-1 h-5 bg-neon-green rounded-full" />
        <h2 className="text-sm font-bold text-neon-green glow-green uppercase tracking-widest">The Street</h2>
        <span className="text-text-muted text-[10px] ml-1">// community signal</span>
        {repos.length > 0 && (
          <button
            onClick={() => exportReposAsMarkdown(repos, 'The-Street', timeRange)}
            className="ml-auto px-2 py-0.5 text-[10px] text-text-muted t-border border rounded hover:text-neon-green hover:border-neon-green/30 transition-colors"
            title="Export list"
          >↓ Export</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {loading && (
          <div className="text-neon-cyan text-xs animate-pulse py-8 text-center">◌ intercepting network traffic...</div>
        )}
        {error && (
          <div className="text-red-600 text-xs py-4 border border-red-300 rounded px-3">⚠ SIGNAL LOST — {error}</div>
        )}
        <div className="grid gap-2">
          {repos.map((repo, i) => <RepoCard key={repo.id} repo={repo} rank={i + 1} />)}
        </div>
      </div>
    </section>
  );
}
