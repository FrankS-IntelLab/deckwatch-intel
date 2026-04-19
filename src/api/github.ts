import type { GitHubRepo, TimeRange, TitanOrg } from '../types';

const BASE = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
  const token = localStorage.getItem('dw_gh_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

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
  else if (range === '48h') d.setDate(d.getDate() - 2);
  else if (range === 'weekly') d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (res.status === 403 && remaining === '0') {
      throw new Error('GitHub API rate limit exceeded. Add a GitHub token in ⚙ Settings to get 5000 req/hr.');
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }
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
