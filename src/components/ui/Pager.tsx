import Link from 'next/link';

/** "See more" pagination that keeps the current filters in the URL. */
export default function Pager({ basePath, params, page, pageSize, total }: { basePath: string; params: Record<string, string | undefined>; page: number; pageSize: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 && (
        <Link className="btn btn-outline" href={href(page - 1)}>
          ← Previous
        </Link>
      )}
      <span className="btn btn-ghost" aria-current="page">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link className="btn btn-outline" href={href(page + 1)}>
          See more →
        </Link>
      )}
    </nav>
  );
}
