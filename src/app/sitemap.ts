import type { MetadataRoute } from 'next';
import { listBuilds } from '@/lib/builds';
import { listModels, listParts, partHref } from '@/lib/catalog';
import { listOwnerBuilds } from '@/lib/community';
import { listArticles } from '@/lib/content';
import { comparisons } from '@/lib/comparisons';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? 'http://localhost:3000';
  const url = (p: string) => `${base}${p}`;
  const pages = ['/', '/garage', '/builds', '/community-builds', '/ratings', '/marketplace', '/marketplace/wheels', '/marketplace/tires', '/marketplace/suspension', '/marketplace/aero', '/fitment', '/journal', '/magazine', '/map', '/shops', '/auctions', '/about', '/compare'];
  return [
    ...pages.map((p) => ({ url: url(p), changeFrequency: 'daily' as const, priority: p === '/' ? 1 : 0.8 })),
    ...listModels().map((m) => ({ url: url(`/garage/${m.slug}`), priority: 0.7 })),
    ...listBuilds({ limit: 100, range: 'all' }).items.map((b) => ({ url: url(b.href), priority: 0.6 })),
    ...listOwnerBuilds({ limit: 100 }).items.map((o) => ({ url: url(o.href), priority: 0.6 })),
    ...listArticles({ limit: 200 }).map((a) => ({ url: url(a.href), priority: 0.6 })),
    ...listParts().map((p) => ({ url: url(partHref(p)), priority: 0.5 })),
    ...comparisons.map((c) => ({ url: url(`/compare/${c.slug}`), priority: 0.5 })),
  ];
}
