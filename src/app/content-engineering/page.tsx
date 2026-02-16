'use client';

import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import AllPostsTable from '@/components/employees/AllPostsTable';
import type { PostEntry } from '@/components/employees/AllPostsTable';
import StatCard from '@/components/dashboard/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import PageHeader from '@/components/ui/PageHeader';
import { Search, Globe, Users, TrendingUp, BarChart3, MessageCircle } from 'lucide-react';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMention = any;

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

  // ── Overview stats ──
  const stats = useMemo(() => {
    if (!mentionsList.length) return { total: 0, uniqueAuthors: 0, totalEngagement: 0, avgEngagement: 0 };
    const total = mentionsList.length;
    const uniqueAuthors = new Set(mentionsList.map((m: AnyMention) => m.authorName)).size;
    const totalEngagement = mentionsList.reduce(
      (sum: number, m: AnyMention) => sum + (m.post.engagement?.engagementScore || 0), 0
    );
    const avgEngagement = total > 0 ? Math.round(totalEngagement / total) : 0;
    return { total, uniqueAuthors, totalEngagement, avgEngagement };
  }, [mentionsList]);

  // ── Map mentions → PostEntry for AllPostsTable / TopPostsCarousel ──
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
      entries = entries.filter(
        p => p.authorName.toLowerCase().includes(q) || p.textContent.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [mentionsList, searchQuery]);

  // ── Map mentions → LeaderboardTable format ──
  const leaderboardMentions = useMemo(() => {
    let entries = mentionsList.map((m: AnyMention, i: number) => ({
      id: m.id,
      rank: i + 1,
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
      entries = entries.filter(
        (e: { authorName: string; postExcerpt: string }) =>
          e.authorName.toLowerCase().includes(q) || e.postExcerpt.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [mentionsList, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader title="Community" accentLabel="External Mentions" icon={Globe} statValue={stats.total} statLabel="mentions" />

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

      {/* Tab content */}
      {contentEngTab === 'overview' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="card" className="h-28" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="External Mentions" value={stats.total} icon={MessageCircle} />
                <StatCard title="Unique Authors" value={stats.uniqueAuthors} icon={Users} />
                <StatCard title="Total Engagement" value={stats.totalEngagement.toLocaleString()} icon={TrendingUp} />
                <StatCard title="Avg Engagement" value={stats.avgEngagement.toLocaleString()} icon={BarChart3} />
              </div>
              <AllPostsTable posts={postEntries} />
            </>
          )}
        </>
      )}

      {contentEngTab === 'leaderboard' && (
        isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-20" />
            ))}
          </div>
        ) : (
          <LeaderboardTable mentions={leaderboardMentions} />
        )
      )}

      {contentEngTab === 'posts' && (
        isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-14" />
            ))}
          </div>
        ) : (
          <AllPostsTable posts={postEntries} />
        )
      )}
    </div>
  );
}
