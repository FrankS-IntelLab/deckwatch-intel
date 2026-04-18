import { useEffect, useState } from 'react';
import type { GitHubRepo } from '../types';
import { TITANS, fetchOrgRepos } from '../api/github';
import RepoCard from './RepoCard';
import { exportReposAsMarkdown } from '../utils/export';

export default function TitansPanel({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<Record<string, GitHubRepo[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled(
      TITANS.map(t =>
        fetchOrgRepos(t.github, 5)
          .then(repos => ({ org: t.github, repos, error: '' }))
          .catch(e => ({ org: t.github, repos: [] as GitHubRepo[], error: e.message }))
      )
    )
      .then(results => {
        const map: Record<string, GitHubRepo[]> = {};
        const errs: Record<string, string> = {};
        results.forEach(r => {
          const val = r.status === 'fulfilled' ? r.value : { org: '', repos: [], error: 'Unknown' };
          if (val.org) {
            if (val.error) errs[val.org] = val.error;
            else map[val.org] = val.repos;
          }
        });
        setData(map);
        setErrors(errs);
      })
      .finally(() => setLoading(false));
  }, []);

  const allRepos = Object.values(data).flat();

  return (
    <section className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-1 h-5 bg-neon-magenta rounded-full" />
        <h2 className="text-sm font-bold text-neon-magenta glow-magenta uppercase tracking-widest">Megacorps</h2>
        <span className="text-text-muted text-[10px] ml-1">// corporate surveillance</span>
        {allRepos.length > 0 && (
          <button
            onClick={() => exportReposAsMarkdown(allRepos, 'Megacorps', timeRange)}
            className="ml-auto px-2 py-0.5 text-[10px] text-text-muted t-border border rounded hover:text-neon-magenta hover:border-neon-magenta/30 transition-colors"
            title="Export list"
          >↓ Export</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {loading && (
          <div className="text-neon-magenta text-xs animate-pulse py-8 text-center">◌ breaching corporate firewalls...</div>
        )}
        <div className="grid gap-2">
          {TITANS.map(titan => {
            const isOpen = expanded === titan.github;
            const repos = data[titan.github];
            const error = errors[titan.github];
            return (
              <div key={titan.github} className={`t-card border rounded overflow-hidden transition-colors ${isOpen ? 'border-neon-cyan/30 animate-pulse-border' : 't-border'}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : titan.github)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-colors group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: titan.color, boxShadow: `0 0 6px ${titan.color}` }} />
                    <span className="font-semibold text-sm tracking-wide" style={{ color: titan.color }}>{titan.name}</span>
                  </div>
                  <span className="text-text-muted text-[10px] group-hover:text-text-primary transition-colors">
                    {error
                      ? <span className="text-red-500">⚠ error</span>
                      : `[${repos?.length ?? '..'}] repos`
                    } {isOpen ? '▴' : '▾'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 grid gap-2 t-border border-t">
                    {error && <div className="text-red-500 text-xs py-2">⚠ {error}</div>}
                    {repos?.map(repo => <RepoCard key={repo.id} repo={repo} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
