'use client';

import ProspectCard from '@/components/ones-to-watch/ProspectCard';
import Skeleton from '@/components/ui/Skeleton';
import PageHeader from '@/components/ui/PageHeader';
import { Eye, Search } from 'lucide-react';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import type { CompanyMention } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Classification regexes — first match wins
const MARKETING_RE = /\b(cmo|vp.*(market|growth)|head of.*(market|growth)|chief market)/i;
const SEO_RE = /\b(director|vp|head of|svp|evp).*(seo|geo|organic|content)/i;
const SENIOR_RE = /\b(director|vp|svp|evp|ceo|coo|cfo|cto|cpo|chief|head of|president)\b/i;

type Category = 'marketing' | 'seo' | 'senior';

function classifyHeadline(headline: string): Category | null {
  if (MARKETING_RE.test(headline)) return 'marketing';
  if (SEO_RE.test(headline)) return 'seo';
  if (SENIOR_RE.test(headline)) return 'senior';
  return null;
}

interface Prospect {
  name: string;
  headline: string;
  avatarUrl: string;
  likes: number;
  postUrl: string;
  category: Category;
}

const SECTIONS: { key: Category; label: string }[] = [
  { key: 'marketing', label: 'Marketing Leaders' },
  { key: 'seo', label: 'SEO / Organic Leaders' },
  { key: 'senior', label: 'Other Senior Leaders' },
];

export default function OnesToWatchPage() {
  const [search, setSearch] = useState('');

  const { data: mentions, isLoading } = useSWR<CompanyMention[]>(
    '/api/mentions?range=14&external=true',
    fetcher,
  );

  const prospects = useMemo((): Prospect[] => {
    if (!mentions) return [];

    // Filter to external only (author is null) with a headline
    const external = mentions.filter(
      (m) => !m.author && m.post.externalAuthorHeadline,
    );

    // Deduplicate by author name — keep highest engagement per author
    const best = new Map<string, CompanyMention>();
    for (const m of external) {
      const name = m.post.externalAuthorName ?? '';
      const existing = best.get(name);
      if (!existing || (m.post.engagement?.likes ?? 0) > (existing.post.engagement?.likes ?? 0)) {
        best.set(name, m);
      }
    }

    // Classify and build prospect list
    const result: Prospect[] = [];
    for (const m of best.values()) {
      const headline = m.post.externalAuthorHeadline ?? '';
      const category = classifyHeadline(headline);
      if (!category) continue;

      result.push({
        name: m.post.externalAuthorName ?? 'Unknown',
        headline,
        avatarUrl: m.post.externalAuthorAvatarUrl ?? '',
        likes: m.post.engagement?.likes ?? 0,
        postUrl: m.post.url,
        category,
      });
    }

    // Sort by likes descending within each category
    result.sort((a, b) => b.likes - a.likes);

    return result;
  }, [mentions]);

  // Apply search filter
  const filtered = useMemo(() => {
    if (!search) return prospects;
    const q = search.toLowerCase();
    return prospects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.headline.toLowerCase().includes(q),
    );
  }, [prospects, search]);

  const totalCount = prospects.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ones to Watch"
        accentLabel="Prospects"
        icon={Eye}
        statValue={totalCount}
        statLabel="prospects"
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search prospects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-elevated rounded-full py-3 pl-12 pr-4 text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-linkify-green transition-all"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-8">
          {[...Array(3)].map((_, s) => (
            <div key={s} className="space-y-4">
              <Skeleton variant="card" className="h-6 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="card" className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {!isLoading && SECTIONS.map(({ key, label }) => {
        const items = filtered.filter((p) => p.category === key);
        if (items.length === 0) return null;

        return (
          <section key={key} className="space-y-4">
            <h2 className="text-lg font-bold text-white">{label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items.map((p) => (
                <ProspectCard
                  key={p.name}
                  name={p.name}
                  headline={p.headline}
                  avatarUrl={p.avatarUrl}
                  likes={p.likes}
                  postUrl={p.postUrl}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No prospects found</p>
          <p className="text-sm mt-1">
            {search
              ? 'Try adjusting your search terms'
              : 'No external mentions from senior leaders in the last 14 days'}
          </p>
        </div>
      )}
    </div>
  );
}
