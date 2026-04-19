import type { GitHubRepo, TimeRange, TitanOrg } from '../types';

const BASE = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
  const token = localStorage.getItem('dw_gh_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export const TITANS: TitanOrg[] = [
  // US AI Labs
  { name: 'Anthropic', github: 'anthropics', color: '#d97706', category: 'us-ai' },
  { name: 'OpenAI', github: 'openai', color: '#10b981', category: 'us-ai' },
  { name: 'Google DeepMind', github: 'google-deepmind', color: '#3b82f6', category: 'us-ai' },
  { name: 'Meta AI', github: 'facebookresearch', color: '#6366f1', category: 'us-ai' },
  { name: 'Microsoft', github: 'microsoft', color: '#ef4444', category: 'us-ai' },
  { name: 'Hugging Face', github: 'huggingface', color: '#f59e0b', category: 'us-ai' },
  { name: 'Mistral AI', github: 'mistralai', color: '#8b5cf6', category: 'us-ai' },
  { name: 'xAI', github: 'xai-org', color: '#f472b6', category: 'us-ai' },
  // Global AI
  { name: 'Baidu', github: 'PaddlePaddle', color: '#2563eb', category: 'global-ai' },
  { name: 'Alibaba (Qwen)', github: 'QwenLM', color: '#f97316', category: 'global-ai' },
  { name: 'DeepSeek', github: 'deepseek-ai', color: '#06b6d4', category: 'global-ai' },
  { name: 'Zhipu AI (GLM)', github: 'THUDM', color: '#a855f7', category: 'global-ai' },
  { name: '01.AI (Yi)', github: '01-ai', color: '#14b8a6', category: 'global-ai' },
  { name: 'ByteDance', github: 'bytedance', color: '#ec4899', category: 'global-ai' },
  { name: 'Stability AI', github: 'Stability-AI', color: '#7c3aed', category: 'global-ai' },
  { name: 'Cohere', github: 'cohere-ai', color: '#22d3ee', category: 'global-ai' },
  // Supply Chain & AI Infrastructure
  { name: 'NVIDIA', github: 'NVIDIA', color: '#84cc16', category: 'supply-chain' },
  { name: 'AMD', github: 'ROCm', color: '#dc2626', category: 'supply-chain' },
  { name: 'Intel', github: 'intel', color: '#0ea5e9', category: 'supply-chain' },
  { name: 'SAP', github: 'SAP', color: '#0284c7', category: 'supply-chain' },
  { name: 'Apple', github: 'apple', color: '#a3a3a3', category: 'supply-chain' },
  { name: 'Qualcomm', github: 'quic', color: '#3b82f6', category: 'supply-chain' },
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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; ts: number }>();

async function fetchJSON<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (res.status === 403 && remaining === '0') {
      throw new Error('GitHub API rate limit exceeded. Add a GitHub token in ⚙ Settings to get 5000 req/hr.');
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
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
