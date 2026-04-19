export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  open_issues_count: number;
}

export type TimeRange = 'daily' | '48h' | 'weekly' | 'monthly';

export interface TitanOrg {
  name: string;
  github: string;
  color: string;
}
