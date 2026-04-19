import { useState, useEffect, useMemo } from 'react';
import type { GitHubRepo, TitanCategory, TimeRange } from '../types';
import { TITANS, fetchOrgRepos, fetchOrgStarActivity } from '../api/github';
import RepoCard from './RepoCard';
import { exportReposAsMarkdown } from '../utils/export';

const CATEGORY_LABELS: Record<TitanCategory, { label: string; tag: string }> = {
  'us-ai': { label: 'US AI Labs', tag: '// domestic ops' },
  'global-ai': { label: 'Global AI', tag: '// foreign signals' },
  'supply-chain': { label: 'Supply Chain & Infra', tag: '// hardware + enablers' },
};

const CUSTOM_COLORS = ['#e879f9', '#34d399'];

function loadCustomSlots(): string[] {
  try {
    const raw = localStorage.getItem('dw_custom_orgs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['', ''];
}

function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

interface StarActivity { totalStars: number; repoCount: number }

export default function TitansPanel({ timeRange, range }: { timeRange: string; range: TimeRange }) {
  const [data, setData] = useState<Record<string, GitHubRepo[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingOrgs, setLoadingOrgs] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customSlots, setCustomSlots] = useState<string[]>(loadCustomSlots);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activity, setActivity] = useState<Record<string, StarActivity>>({});
  const [sortByStars, setSortByStars] = useState(false);

  // Fetch star activity for all orgs when range changes
  useEffect(() => {
    let cancelled = false;
    const allOrgs = [...TITANS.map(t => t.github), ...customSlots.filter(Boolean)];
    // Search API: 10 req/min unauthenticated, 30 req/min with token
    async function fetchAll() {
      const batchSize = 3;
      for (let i = 0; i < allOrgs.length; i += batchSize) {
        if (cancelled) return;
        const batch = allOrgs.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(org => fetchOrgStarActivity(org, range).then(r => ({ org, ...r })))
        );
        if (cancelled) return;
        setActivity(prev => {
          const next = { ...prev };
          results.forEach(r => {
            if (r.status === 'fulfilled') next[r.value.org] = { totalStars: r.value.totalStars, repoCount: r.value.repoCount };
          });
          return next;
        });
        // Wait between batches to respect search rate limit
        if (i + batchSize < allOrgs.length) {
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }
    }
    setActivity({});
    fetchAll();
    return () => { cancelled = true; };
  }, [range, customSlots]);

  const toggleOrg = (github: string) => {
    if (expanded === github) { setExpanded(null); return; }
    setExpanded(github);
    if (data[github] || errors[github]) return;
    setLoadingOrgs(prev => ({ ...prev, [github]: true }));
    fetchOrgRepos(github, 5)
      .then(repos => setData(prev => ({ ...prev, [github]: repos })))
      .catch(e => setErrors(prev => ({ ...prev, [github]: e.message })))
      .finally(() => setLoadingOrgs(prev => ({ ...prev, [github]: false })));
  };

  const saveSlot = (idx: number) => {
    const val = editValue.trim().replace(/^.*github\.com\//, '').replace(/\/$/, '');
    const next = [...customSlots];
    if (next[idx] && next[idx] !== val) {
      setData(prev => { const d = { ...prev }; delete d[next[idx]]; return d; });
      setErrors(prev => { const e = { ...prev }; delete e[next[idx]]; return e; });
    }
    next[idx] = val;
    setCustomSlots(next);
    localStorage.setItem('dw_custom_orgs', JSON.stringify(next));
    setEditingSlot(null);
    setEditValue('');
  };

  const clearSlot = (idx: number) => {
    const org = customSlots[idx];
    if (org) {
      setData(prev => { const d = { ...prev }; delete d[org]; return d; });
      setErrors(prev => { const e = { ...prev }; delete e[org]; return e; });
      if (expanded === org) setExpanded(null);
    }
    const next = [...customSlots];
    next[idx] = '';
    setCustomSlots(next);
    localStorage.setItem('dw_custom_orgs', JSON.stringify(next));
  };

  const allRepos = Object.values(data).flat();
  const categories = ['us-ai', 'global-ai', 'supply-chain'] as TitanCategory[];

  // Sort titans within each category by star activity if enabled
  const sortedTitans = useMemo(() => {
    if (!sortByStars) return null;
    return [...TITANS].sort((a, b) => (activity[b.github]?.totalStars ?? 0) - (activity[a.github]?.totalStars ?? 0));
  }, [sortByStars, activity]);

  const StarBadge = ({ github }: { github: string }) => {
    const a = activity[github];
    if (!a) return <span className="text-[10px] text-text-muted/30 ml-auto mr-2 animate-pulse">★ ···</span>;
    const heat = a.totalStars >= 10000 ? 'text-neon-yellow' : a.totalStars >= 1000 ? 'text-neon-cyan' : 'text-text-muted';
    return (
      <span className={`text-[10px] ${heat} ml-auto mr-2 tabular-nums`} title={`${a.repoCount} active repos · ${a.totalStars.toLocaleString()} stars on top repos`}>
        ★{formatStars(a.totalStars)} · {a.repoCount}r
      </span>
    );
  };

  const renderOrg = (github: string, name: string, color: string) => {
    const isOpen = expanded === github;
    const repos = data[github];
    const error = errors[github];
    const isLoading = loadingOrgs[github];
    return (
      <div key={github} className={`t-card border rounded overflow-hidden transition-colors ${isOpen ? 'border-neon-cyan/30 animate-pulse-border' : 't-border'}`}>
        <button
          onClick={() => toggleOrg(github)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-colors group"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="font-semibold text-sm tracking-wide" style={{ color }}>{name}</span>
          </div>
          <div className="flex items-center">
            <StarBadge github={github} />
            <span className="text-text-muted text-[10px] group-hover:text-text-primary transition-colors">
              {error ? <span className="text-red-500">⚠ error</span> : repos ? `[${repos.length}]` : ''}
              {' '}{isOpen ? '▴' : '▾'}
            </span>
          </div>
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
  };

  return (
    <section className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-1 h-5 bg-neon-magenta rounded-full" />
        <h2 className="text-sm font-bold text-neon-magenta glow-magenta uppercase tracking-widest">Megacorps</h2>
        <span className="text-text-muted text-[10px] ml-1">// corporate surveillance</span>
        <button
          onClick={() => setSortByStars(!sortByStars)}
          className={`ml-auto px-2 py-0.5 text-[10px] border rounded transition-colors ${sortByStars ? 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10' : 'text-text-muted t-border hover:text-neon-yellow hover:border-neon-yellow/30'}`}
          title={sortByStars ? 'Grouped by category' : 'Sort all by star activity'}
        >★ {sortByStars ? 'sorted' : 'sort'}</button>
        {allRepos.length > 0 && (
          <button
            onClick={() => exportReposAsMarkdown(allRepos, 'Megacorps', timeRange)}
            className="px-2 py-0.5 text-[10px] text-text-muted t-border border rounded hover:text-neon-magenta hover:border-neon-magenta/30 transition-colors"
            title="Export list"
          >↓ Export</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <div className="grid gap-4">
          {sortByStars && sortedTitans ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-neon-yellow uppercase tracking-widest">All Orgs</span>
                <span className="text-text-muted text-[10px]">// ranked by ★ activity ({timeRange})</span>
              </div>
              <div className="grid gap-2">
                {sortedTitans.map(t => renderOrg(t.github, t.name, t.color))}
                {customSlots.filter(Boolean).map((org, i) => renderOrg(org, org, CUSTOM_COLORS[i]))}
              </div>
            </div>
          ) : (
            <>
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
                      {titans.map(t => renderOrg(t.github, t.name, t.color))}
                    </div>
                  </div>
                );
              })}

              {/* Custom slots */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Custom</span>
                  <span className="text-text-muted text-[10px]">// your targets</span>
                </div>
                <div className="grid gap-2">
                  {customSlots.map((org, idx) => {
                    const color = CUSTOM_COLORS[idx];
                    const isEditing = editingSlot === idx;

                    if (!org) {
                      return (
                        <div key={`custom-${idx}`} className="t-card t-border border rounded">
                          {isEditing ? (
                            <form onSubmit={e => { e.preventDefault(); saveSlot(idx); }} className="flex items-center gap-2 px-4 py-2">
                              <span className="w-2 h-2 rounded-full opacity-40" style={{ background: color }} />
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                placeholder="GitHub org name, e.g. vercel"
                                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted/50" />
                              <button type="submit" className="text-[10px] text-neon-cyan hover:text-neon-cyan/80">Save</button>
                              <button type="button" onClick={() => setEditingSlot(null)} className="text-[10px] text-text-muted hover:text-text-primary">Cancel</button>
                            </form>
                          ) : (
                            <button onClick={() => { setEditingSlot(idx); setEditValue(''); }}
                              className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:opacity-80 transition-colors">
                              <span className="w-2 h-2 rounded-full border border-dashed opacity-40" style={{ borderColor: color }} />
                              <span className="text-text-muted text-sm italic">+ add org</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    const isOpen = expanded === org;
                    const repos = data[org];
                    const error = errors[org];
                    const isLoading = loadingOrgs[org];

                    return (
                      <div key={`custom-${idx}`} className={`t-card border rounded overflow-hidden transition-colors ${isOpen ? 'border-neon-cyan/30 animate-pulse-border' : 't-border'}`}>
                        {isEditing ? (
                          <form onSubmit={e => { e.preventDefault(); saveSlot(idx); }} className="flex items-center gap-2 px-4 py-2.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                              placeholder="GitHub org name"
                              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted/50" />
                            <button type="submit" className="text-[10px] text-neon-cyan hover:text-neon-cyan/80">Save</button>
                            <button type="button" onClick={() => setEditingSlot(null)} className="text-[10px] text-text-muted hover:text-text-primary">Cancel</button>
                          </form>
                        ) : (
                          <button onClick={() => toggleOrg(org)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-colors group"
                            aria-expanded={isOpen}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                              <span className="font-semibold text-sm tracking-wide" style={{ color }}>{org}</span>
                              <button onClick={e => { e.stopPropagation(); setEditingSlot(idx); setEditValue(org); }}
                                className="text-[10px] text-text-muted hover:text-neon-cyan ml-1" title="Edit">✎</button>
                              <button onClick={e => { e.stopPropagation(); clearSlot(idx); }}
                                className="text-[10px] text-text-muted hover:text-red-500" title="Remove">✕</button>
                            </div>
                            <div className="flex items-center">
                              <StarBadge github={org} />
                              <span className="text-text-muted text-[10px] group-hover:text-text-primary transition-colors">
                                {error ? <span className="text-red-500">⚠ error</span> : repos ? `[${repos.length}]` : ''}
                                {' '}{isOpen ? '▴' : '▾'}
                              </span>
                            </div>
                          </button>
                        )}
                        {isOpen && !isEditing && (
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
