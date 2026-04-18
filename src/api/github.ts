import type { GitHubRepo, TimeRange, TitanOrg } from '../types';

const BASE = 'https://api.github.com';
const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };

export const TITANS: TitanOrg[] = [
  { name: 'Anthropic', github: 'anthropics', color: '#d97706' },
  { name: 'OpenAI', github: 'openai', color: '#10b981' },
  { name: 'Google DeepMind', github: 'google-deepmind', color: '#3b82f6' },
  { name: 'Meta AI', github: 'facebookresearch', color: '#6366f1' },
  { name: 'Microsoft', github: 'microsoft', color: '#ef4444' },
  { name: 'Hugging Face', github: 'huggingface', color: '#f59e0b' },
  { name: 'Mistral AI', github: 'mistralai', color: '#8b5cf6' },
];

function getDateRange(range: TimeRange): string {
  const now = new Date();
  const d = new Date(now);
  if (range === 'daily') d.setDate(d.getDate() - 1);
  else if (range === 'weekly') d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function fetchTrending(range: TimeRange, limit = 15): Promise<GitHubRepo[]> {
  const since = getDateRange(range);
  const data = await fetchJSON<{ items: GitHubRepo[] }>(
    `${BASE}/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=${limit}`
  );
  return data.items;
}

export async function fetchOrgRepos(org: string, limit = 10): Promise<GitHubRepo[]> {
  return fetchJSON<GitHubRepo[]>(
    `${BASE}/orgs/${org}/repos?sort=pushed&direction=desc&per_page=${limit}`
  );
}
