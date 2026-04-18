import type { GitHubRepo } from '../types';

export function exportReposAsMarkdown(repos: GitHubRepo[], title: string, timeRange: string) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const lines = [
    `# ${title}`,
    `> Time range: ${timeRange} | Exported: ${now.toLocaleString()}`,
    '',
    '| # | Repo | Stars | Forks | Language | Last Push |',
    '|---|------|-------|-------|----------|-----------|',
    ...repos.map((r, i) =>
      `| ${i + 1} | [${r.full_name}](${r.html_url}) | ${r.stargazers_count} | ${r.forks_count} | ${r.language || 'N/A'} | ${r.pushed_at?.slice(0, 10) || 'N/A'} |`
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}_${timeRange}_${timestamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
