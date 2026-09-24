export function parseSqlTime(s: string) {
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
}

export function timeAgo(s: string) {
  const diff = (Date.now() - parseSqlTime(s).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return parseSqlTime(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function money(cents: number | null) {
  if (cents === null) return 'Upon request';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function fmtDate(s: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return parseSqlTime(s).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
}
