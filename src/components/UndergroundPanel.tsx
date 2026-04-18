import { useEffect, useState } from 'react';
import type { GitHubRepo, TimeRange } from '../types';
import { fetchTrending } from '../api/github';
import RepoCard from './RepoCard';

export default function UndergroundPanel({ range }: { range: TimeRange }) {
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
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-neon-green rounded-full" />
        <h2 className="text-sm font-bold text-neon-green glow-green uppercase tracking-widest">
          The Street
        </h2>
        <span className="text-text-muted text-[10px] ml-1">// community signal</span>
      </div>
      <p className="text-text-muted text-xs mb-4 border-l-2 border-neon-green/30 pl-3">
        Trending repos from the open-source community. The street is always building.
      </p>
      {loading && (
        <div className="text-neon-cyan text-xs animate-pulse py-8 text-center">
          ◌ intercepting network traffic...
        </div>
      )}
      {error && (
        <div className="text-red-600 text-xs py-4 border border-red-300 rounded px-3 bg-red-50">
          ⚠ SIGNAL LOST — {error}
        </div>
      )}
      <div className="grid gap-2">
        {repos.map((repo, i) => (
          <RepoCard key={repo.id} repo={repo} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}
