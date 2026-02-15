'use client';

import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import Skeleton from '@/components/ui/Skeleton';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';
import { useAppStore } from '@/stores/app-store';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TIME_RANGES = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
] as const;

const SORT_OPTIONS = [
  { label: 'Engagement', value: 'engagement' },
  { label: 'Likes', value: 'likes' },
  { label: 'Comments', value: 'comments' },
  { label: 'Shares', value: 'shares' },
  { label: 'Recent', value: 'recent' },
] as const;

export default function LeaderboardPage() {
  const { timeRange, setTimeRange, leaderboardSort, setLeaderboardSort } = useAppStore();

  const { data: mentions, isLoading } = useSWR(
    `/api/mentions?range=${timeRange}&sort=${leaderboardSort}`,
    fetcher
  );

  const mentionsList = (mentions || []) as {
    id: string;
    rank: number;
    author: { fullName: string; avatarUrl: string };
    post: {
      textContent: string;
      url: string;
      engagement: { likes: number; comments: number; shares: number; engagementScore: number };
    };
  }[];

  const topMention = mentionsList[0] ?? null;
  const totalMentions = mentionsList.length;
  const totalEngagement = mentionsList.reduce(
    (sum, m) => sum + m.post.engagement.engagementScore, 0
  );

  return (
    <div className="space-y-4">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d]">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#4ade80]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#22c55e]/6 rounded-full blur-3xl" />

        <div className="relative flex items-end gap-6 p-8">
          {/* Album art — top poster avatar or trophy icon */}
          <div className="flex-shrink-0 w-48 h-48 rounded-lg shadow-2xl shadow-black/60 overflow-hidden bg-gradient-to-br from-[#4ade80]/20 to-[#166534]/40">
            {topMention ? (
              <Image
                src={topMention.author.avatarUrl}
                alt={topMention.author.fullName}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-20 h-20 text-[#4ade80]/60" />
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80] mb-2">
              Trending
            </p>
            <h1 className="text-6xl font-extrabold text-white tracking-tight leading-none mb-4">
              What&apos;s Trending
            </h1>

            <div className="flex items-center gap-3 text-sm text-neutral-300">
              {topMention && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#4ade80]" />
                    <span className="font-semibold text-white">{topMention.author.fullName}</span>
                  </span>
                  <span className="text-neutral-500">&middot;</span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-400" />
                {totalMentions} posts
              </span>
              <span className="text-neutral-500">&middot;</span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                {totalEngagement.toLocaleString()} total engagement
              </span>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="h-8 bg-gradient-to-b from-transparent to-[#121212]" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-white text-black'
                  : 'bg-elevated text-neutral-300 hover:bg-highlight hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="w-px bg-highlight mx-2" />

        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setLeaderboardSort(option.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                leaderboardSort === option.value
                  ? 'bg-linkify-green/20 text-linkify-green'
                  : 'bg-elevated text-neutral-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-20" />
          ))}
        </div>
      ) : (
        <LeaderboardTable
          mentions={mentionsList.map((m) => ({
            id: m.id,
            rank: m.rank,
            authorName: m.author.fullName,
            authorAvatar: m.author.avatarUrl,
            postExcerpt: m.post.textContent,
            likes: m.post.engagement.likes,
            comments: m.post.engagement.comments,
            shares: m.post.engagement.shares,
            engagementScore: m.post.engagement.engagementScore,
            postUrl: m.post.url,
          }))}
        />
      )}
    </div>
  );
}
