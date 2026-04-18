import { useEffect, useState } from 'react';
import type { GitHubRepo } from '../types';
import { TITANS, fetchOrgRepos } from '../api/github';
import RepoCard from './RepoCard';

export default function TitansPanel() {
  const [data, setData] = useState<Record<string, GitHubRepo[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      TITANS.map(t =>
        fetchOrgRepos(t.github, 5).then(repos => ({ org: t.github, repos }))
      )
    )
      .then(results => {
        const map: Record<string, GitHubRepo[]> = {};
        results.forEach(r => (map[r.org] = r.repos));
        setData(map);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-neon-magenta rounded-full" />
        <h2 className="text-sm font-bold text-neon-magenta glow-magenta uppercase tracking-widest">
          Megacorps
        </h2>
        <span className="text-text-muted text-[10px] ml-1">// corporate surveillance</span>
      </div>
      <p className="text-text-muted text-xs mb-4 border-l-2 border-neon-magenta/30 pl-3">
        Tracking the giants. What are they shipping? What are they hiding?
      </p>
      {loading && (
        <div className="text-neon-magenta text-xs animate-pulse py-8 text-center">
          ◌ breaching corporate firewalls...
        </div>
      )}
      <div className="grid gap-2">
        {TITANS.map(titan => {
          const isOpen = expanded === titan.github;
          const repos = data[titan.github];
          return (
            <div
              key={titan.github}
              className={`bg-lite-card border rounded overflow-hidden transition-colors ${
                isOpen ? 'border-neon-cyan/30 animate-pulse-border' : 'border-lite-border'
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : titan.github)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-lite-surface/50 transition-colors group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: titan.color, boxShadow: `0 0 6px ${titan.color}` }}
                  />
                  <span className="font-semibold text-sm tracking-wide" style={{ color: titan.color }}>
                    {titan.name}
                  </span>
                </div>
                <span className="text-text-muted text-[10px] group-hover:text-text-primary transition-colors">
                  [{repos?.length ?? '..'}] repos {isOpen ? '▴' : '▾'}
                </span>
              </button>
              {isOpen && repos && (
                <div className="px-3 pb-3 grid gap-2 border-t border-lite-border/50">
                  {repos.map(repo => (
                    <RepoCard key={repo.id} repo={repo} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
