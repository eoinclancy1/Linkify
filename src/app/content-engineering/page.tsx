'use client';

import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import AllPostsTable from '@/components/employees/AllPostsTable';
import type { PostEntry } from '@/components/employees/AllPostsTable';
import StatCard from '@/components/dashboard/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import {
  Search, Users, TrendingUp, BarChart3, MessageCircle,
  Heart, MessageSquare, Share2, GraduationCap, Percent, Flame,
} from 'lucide-react';
import useSWR from 'swr';
import { useAppStore } from '@/stores/app-store';
import { useState, useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { label: 'Overview', value: 'overview' as const },
  { label: 'Leaderboard', value: 'leaderboard' as const },
  { label: 'All Posts', value: 'posts' as const },
];

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
] as const;

const SORT_OPTIONS = [
  { label: 'Engagement', value: 'engagement' },
  { label: 'Likes', value: 'likes' },
  { label: 'Comments', value: 'comments' },
  { label: 'Shares', value: 'shares' },
  { label: 'Recent', value: 'recent' },
] as const;

// Replace with actual URL when available
const OVERVIEW_HERO_IMAGE = '';
const LEADERBOARD_HERO_IMAGE = 'https://assets.mybrightsites.com/uploads/sites/14703/themes/30846/03f7efd7ad22cb8a0dd2b17e107e27b941b8eeae/AirOps-ShopHero.jpg?1771354764';

const COHORT_KEYWORDS = [
  'graduation', 'graduated', 'graduating', 'graduate',
  'cohort', 'demo day', 'demoday', 'university', 'academy', 'workflow', 'workflows',
];
const COHORT_REGEX = new RegExp(COHORT_KEYWORDS.join('|'), 'i');
function isCohortPost(text: string): boolean { return COHORT_REGEX.test(text); }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMention = any;

/* ─── Tab hero banners ──────────────────────────────────────── */

function LeaderboardHero({ total }: { total: number }) {
  return (
    <div className="relative h-56 rounded-xl overflow-hidden mb-6">
      <img
        src={LEADERBOARD_HERO_IMAGE}
        alt="Content Engineering Leaderboard"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      {/* gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4ade80] mb-1">Leaderboard</p>
        <h2 className="text-3xl font-extrabold text-white leading-tight">Content Engineering</h2>
        <h2 className="text-3xl font-extrabold text-white leading-tight">Department</h2>
      </div>
      {total > 0 && (
        <div className="absolute bottom-6 right-6 text-right">
          <p className="text-4xl font-extrabold text-white">{total}</p>
          <p className="text-xs uppercase tracking-widest text-neutral-400 mt-0.5">mentions</p>
        </div>
      )}
    </div>
  );
}

function OverviewHero({ total }: { total: number }) {
  return (
    <div
      className="relative h-56 rounded-xl overflow-hidden mb-6"
      style={{ background: '#0a0f0a' }}
    >
      {OVERVIEW_HERO_IMAGE ? (
        <img
          src={OVERVIEW_HERO_IMAGE}
          alt="Content Engineering Overview"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        /* Recreate the "Meet the League" typographic style */
        <div className="absolute inset-0 flex">
          {/* Left: text block */}
          <div className="flex flex-col justify-center px-8 py-6 flex-1 bg-black">
            <p
              className="font-black uppercase leading-none tracking-tight"
              style={{ fontSize: '2.2rem', color: '#c8ff00', lineHeight: 1.1 }}
            >
              MEET THE<br />LEAGUE OF
            </p>
            <p
              className="font-bold italic uppercase tracking-wide mt-1"
              style={{ fontSize: '1.1rem', color: '#ffffff' }}
            >
              extraordinary
            </p>
            <p
              className="font-black uppercase leading-none tracking-tight"
              style={{ fontSize: '2.2rem', color: '#c8ff00', lineHeight: 1.1 }}
            >
              CONTENT<br />ENGINEERS
            </p>
            <p className="mt-2 text-sm font-semibold tracking-widest text-white/70">airops</p>
          </div>
          {/* Right: decorative green block */}
          <div
            className="w-1/2 relative overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a3a14 0%, #2d5e22 50%, #3d7a2d 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#c8ff00]/10 blur-3xl" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
      {total > 0 && (
        <div className="absolute bottom-4 right-5 text-right">
          <p className="text-3xl font-extrabold text-white">{total}</p>
          <p className="text-xs uppercase tracking-widest text-neutral-400 mt-0.5">total mentions</p>
        </div>
      )}
    </div>
  );
}

function AllPostsHero({ total }: { total: number }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden mb-4 px-6 py-5"
      style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', border: '1px solid #282828' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4ade80] mb-1">All Posts</p>
          <h2 className="text-2xl font-extrabold text-white">Content Engineering Dept.</h2>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-3xl font-extrabold text-white">{total}</p>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-0.5">posts</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function ContentEngineeringPage() {
  const {
    searchQuery, setSearchQuery,
    contentEngTab, setContentEngTab,
  } = useAppStore();
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);
  const [sort, setSort] = useState('engagement');

  const { data: mentions, isLoading } = useSWR(
    `/api/mentions?range=${timeRange}&sort=${sort}&external=true`,
    fetcher,
  );

  const mentionsList = (mentions || []) as AnyMention[];

  const stats = useMemo(() => {
    const empty = {
      total: 0, uniqueAuthors: 0, totalEngagement: 0, avgEngagement: 0,
      totalLikes: 0, totalComments: 0, totalShares: 0, topPostScore: 0,
      cohortCount: 0, cohortAuthors: 0, cohortEngagement: 0, cohortPct: 0,
      topCohortAuthor: '—', topCohortAuthorCount: 0,
    };
    if (!mentionsList.length) return empty;

    const total = mentionsList.length;
    const uniqueAuthors = new Set(mentionsList.map((m: AnyMention) => m.authorName)).size;
    let totalEngagement = 0, totalLikes = 0, totalComments = 0, totalShares = 0, topPostScore = 0;
    let cohortCount = 0, cohortEngagement = 0;
    const cohortAuthorSet = new Set<string>();
    const cohortAuthorCounts = new Map<string, number>();

    for (const m of mentionsList) {
      const eng = m.post.engagement?.engagementScore || 0;
      const likes = m.post.engagement?.likes || 0;
      const comments = m.post.engagement?.comments || 0;
      const shares = m.post.engagement?.shares || 0;
      const text = m.post.textContent || '';
      totalEngagement += eng; totalLikes += likes; totalComments += comments; totalShares += shares;
      if (eng > topPostScore) topPostScore = eng;
      if (isCohortPost(text)) {
        cohortCount++; cohortEngagement += eng;
        cohortAuthorSet.add(m.authorName);
        cohortAuthorCounts.set(m.authorName, (cohortAuthorCounts.get(m.authorName) || 0) + 1);
      }
    }
    const avgEngagement = total > 0 ? Math.round(totalEngagement / total) : 0;
    const cohortPct = total > 0 ? Math.round((cohortCount / total) * 100) : 0;
    let topCohortAuthor = '—', topCohortAuthorCount = 0;
    for (const [name, count] of cohortAuthorCounts) {
      if (count > topCohortAuthorCount) { topCohortAuthor = name; topCohortAuthorCount = count; }
    }
    return {
      total, uniqueAuthors, totalEngagement, avgEngagement,
      totalLikes, totalComments, totalShares, topPostScore,
      cohortCount, cohortAuthors: cohortAuthorSet.size, cohortEngagement, cohortPct,
      topCohortAuthor, topCohortAuthorCount,
    };
  }, [mentionsList]);

  const postEntries = useMemo((): PostEntry[] => {
    let entries: PostEntry[] = mentionsList.map((m: AnyMention) => ({
      id: m.id,
      authorName: m.authorName,
      authorAvatar: m.authorAvatarUrl || '',
      textContent: m.post.textContent || '',
      publishedAt: m.post.publishedAt,
      likes: m.post.engagement?.likes || 0,
      comments: m.post.engagement?.comments || 0,
      shares: m.post.engagement?.shares || 0,
      postUrl: m.post.url || '',
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(p => p.authorName.toLowerCase().includes(q) || p.textContent.toLowerCase().includes(q));
    }
    return entries;
  }, [mentionsList, searchQuery]);

  const leaderboardMentions = useMemo(() => {
    let entries = mentionsList.map((m: AnyMention, i: number) => ({
      id: m.id, rank: i + 1,
      authorName: m.authorName,
      authorAvatar: m.authorAvatarUrl || '',
      postExcerpt: m.post.textContent || '',
      likes: m.post.engagement?.likes || 0,
      comments: m.post.engagement?.comments || 0,
      shares: m.post.engagement?.shares || 0,
      engagementScore: m.post.engagement?.engagementScore || 0,
      postUrl: m.post.url || '',
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e: { authorName: string; postExcerpt: string }) =>
        e.authorName.toLowerCase().includes(q) || e.postExcerpt.toLowerCase().includes(q)
      );
    }
    return entries;
  }, [mentionsList, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Page title row */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80]">External Mentions</p>
          <h1 className="text-2xl font-extrabold text-white">Content Engineering Department</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setContentEngTab(tab.value)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              contentEngTab === tab.value
                ? 'bg-white text-black'
                : 'bg-elevated text-neutral-300 hover:bg-highlight hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search authors or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-elevated rounded-full py-3 pl-12 pr-4 text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-linkify-green transition-all"
          />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-white text-black'
                  : 'bg-elevated text-neutral-300 hover:bg-highlight hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        {contentEngTab === 'leaderboard' && (
          <>
            <div className="w-px h-8 bg-highlight flex-shrink-0" />
            <div className="flex gap-1 flex-shrink-0">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSort(option.value)}
                  className={`px-3 py-2.5 rounded-full text-sm transition-colors ${
                    sort === option.value
                      ? 'bg-linkify-green/20 text-linkify-green'
                      : 'bg-elevated text-neutral-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Overview ── */}
      {contentEngTab === 'overview' && (
        isLoading ? (
          <div className="space-y-6">
            <Skeleton variant="card" className="h-56" />
            {[...Array(3)].map((_, section) => (
              <div key={section} className="space-y-3">
                <Skeleton variant="card" className="h-5 w-40" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" className="h-28" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <OverviewHero total={stats.total} />

            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">All External Mentions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Mentions" value={stats.total} icon={MessageCircle} />
                  <StatCard title="Unique Authors" value={stats.uniqueAuthors} icon={Users} />
                  <StatCard title="Total Engagement" value={stats.totalEngagement.toLocaleString()} icon={TrendingUp} />
                  <StatCard title="Avg Engagement" value={stats.avgEngagement.toLocaleString()} icon={BarChart3} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Cohort Activity</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Cohort Posts" value={stats.cohortCount} icon={GraduationCap} />
                  <StatCard title="Cohort Authors" value={stats.cohortAuthors} icon={Users} />
                  <StatCard title="Cohort Engagement" value={stats.cohortEngagement.toLocaleString()} icon={TrendingUp} />
                  <StatCard title="Cohort Share" value={`${stats.cohortPct}%`} icon={Percent} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Engagement Breakdown</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Reactions" value={stats.totalLikes.toLocaleString()} icon={Heart} />
                  <StatCard title="Total Comments" value={stats.totalComments.toLocaleString()} icon={MessageSquare} />
                  <StatCard title="Total Shares" value={stats.totalShares.toLocaleString()} icon={Share2} />
                  <StatCard title="Top Post Score" value={stats.topPostScore.toLocaleString()} icon={Flame} />
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Leaderboard ── */}
      {contentEngTab === 'leaderboard' && (
        isLoading ? (
          <div className="space-y-2">
            <Skeleton variant="card" className="h-56" />
            {[...Array(8)].map((_, i) => <Skeleton key={i} variant="card" className="h-20" />)}
          </div>
        ) : (
          <div className="space-y-4">
            <LeaderboardHero total={stats.total} />
            <LeaderboardTable mentions={leaderboardMentions} />
          </div>
        )
      )}

      {/* ── All Posts ── */}
      {contentEngTab === 'posts' && (
        isLoading ? (
          <div className="space-y-2">
            <Skeleton variant="card" className="h-24" />
            {[...Array(8)].map((_, i) => <Skeleton key={i} variant="card" className="h-14" />)}
          </div>
        ) : (
          <div className="space-y-4">
            <AllPostsHero total={postEntries.length} />
            <AllPostsTable posts={postEntries} />
          </div>
        )
      )}
    </div>
  );
}
