import type { GitHubRepo } from '../types';

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RepoCard({ repo, rank }: { repo: GitHubRepo; rank?: number }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block t-card t-border border rounded p-3 card-glow cyber-border hover:border-neon-cyan/40 transition-all group"
    >
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="text-neon-cyan font-bold text-sm min-w-[2ch] text-right opacity-60 group-hover:opacity-100 transition-opacity">
            #{rank}
          </span>
        )}
        <img src={repo.owner.avatar_url} alt="" className="w-7 h-7 rounded t-border border" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm truncate group-hover:text-neon-cyan transition-colors font-semibold">
            {repo.full_name}
          </h3>
          <p className="text-text-muted text-xs mt-1 line-clamp-2 leading-relaxed">
            {repo.description || '// no description provided'}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
            <span className="text-neon-yellow font-semibold">★ {formatCount(repo.stargazers_count)}</span>
            <span>⑂ {formatCount(repo.forks_count)}</span>
            {repo.language && <span className="text-neon-green font-semibold">{repo.language}</span>}
            <span className="ml-auto opacity-60">{timeAgo(repo.pushed_at)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
