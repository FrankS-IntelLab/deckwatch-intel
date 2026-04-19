import { useState } from 'react';
import type { GitHubRepo, TitanCategory } from '../types';
import { TITANS, fetchOrgRepos } from '../api/github';
import RepoCard from './RepoCard';
import { exportReposAsMarkdown } from '../utils/export';

const CATEGORY_LABELS: Record<TitanCategory, { label: string; tag: string }> = {
  'us-ai': { label: 'US AI Labs', tag: '// domestic ops' },
  'global-ai': { label: 'Global AI', tag: '// foreign signals' },
  'supply-chain': { label: 'Supply Chain & Infra', tag: '// hardware + enablers' },
};

export default function TitansPanel({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<Record<string, GitHubRepo[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingOrgs, setLoadingOrgs] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleOrg = (github: string) => {
    if (expanded === github) {
      setExpanded(null);
      return;
    }
    setExpanded(github);
    if (data[github] || errors[github]) return;
    setLoadingOrgs(prev => ({ ...prev, [github]: true }));
    fetchOrgRepos(github, 5)
      .then(repos => setData(prev => ({ ...prev, [github]: repos })))
      .catch(e => setErrors(prev => ({ ...prev, [github]: e.message })))
      .finally(() => setLoadingOrgs(prev => ({ ...prev, [github]: false })));
  };

  const allRepos = Object.values(data).flat();
  const categories = ['us-ai', 'global-ai', 'supply-chain'] as TitanCategory[];

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
        <div className="grid gap-4">
          {categories.map(cat => {
            const titans = TITANS.filter(t => t.category === cat);
            const { label, tag } = CATEGORY_LABELS[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{label}</span>
                  <span className="text-text-muted text-[10px]">{tag}</span>
                </div>
                <div className="grid gap-2">
                  {titans.map(titan => {
                    const isOpen = expanded === titan.github;
                    const repos = data[titan.github];
                    const error = errors[titan.github];
                    const isLoading = loadingOrgs[titan.github];
                    return (
                      <div key={titan.github} className={`t-card border rounded overflow-hidden transition-colors ${isOpen ? 'border-neon-cyan/30 animate-pulse-border' : 't-border'}`}>
                        <button
                          onClick={() => toggleOrg(titan.github)}
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
                              : repos ? `[${repos.length}] repos` : ''
                            } {isOpen ? '▴' : '▾'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 grid gap-2 t-border border-t">
                            {isLoading && <div className="text-neon-cyan text-xs animate-pulse py-2">◌ fetching intel...</div>}
                            {error && <div className="text-red-500 text-xs py-2">⚠ {error}</div>}
                            {repos?.map(repo => <RepoCard key={repo.id} repo={repo} side="left" />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
