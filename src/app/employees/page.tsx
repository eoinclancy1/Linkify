'use client';

import EmployeeGrid from '@/components/employees/EmployeeGrid';
import EmployeeLeaderboard from '@/components/employees/EmployeeLeaderboard';
import type { LeaderboardEntry } from '@/components/employees/EmployeeLeaderboard';
import AllPostsTable from '@/components/employees/AllPostsTable';
import type { PostEntry } from '@/components/employees/AllPostsTable';
import Skeleton from '@/components/ui/Skeleton';
import PageHeader from '@/components/ui/PageHeader';
import { getStatus, type Status } from '@/components/employees/StatusBadge';
import { Search, Users } from 'lucide-react';
import useSWR from 'swr';
import { useAppStore } from '@/stores/app-store';
import { useState, useMemo } from 'react';

const STATUS_ALBUMS: { status: Status; album: string; subtitle: string; gradient: string }[] = [
  { status: 'healthy', album: 'Top Hits', subtitle: 'Posted in the last 14 days', gradient: 'from-green-600 to-emerald-900' },
  { status: 'starving', album: 'On Thin Ice', subtitle: '15-29 days since last post', gradient: 'from-orange-500 to-amber-900' },
  { status: 'dormant', album: 'Gone Dark', subtitle: '30+ days since last post', gradient: 'from-red-600 to-red-950' },
  { status: 'quiet', album: 'Unreleased', subtitle: 'No posts yet', gradient: 'from-neutral-500 to-neutral-800' },
];

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { label: 'Overview', value: 'overview' as const },
  { label: 'Leaderboard', value: 'leaderboard' as const },
  { label: 'All Posts', value: 'posts' as const },
];


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEmployee = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPost = any;

const POST_TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
] as const;

export default function EmployeesPage() {
  const {
    searchQuery, setSearchQuery,
    employeeTab, setEmployeeTab,
  } = useAppStore();
  const [postsTimeRange, setPostsTimeRange] = useState<7 | 14 | 30>(30);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);

  const { data: employees, isLoading: empLoading } = useSWR('/api/employees', fetcher);
  const { data: streaks } = useSWR('/api/streaks', fetcher);
  const { data: posts30 } = useSWR('/api/posts?range=30', fetcher);
  const { data: allPosts } = useSWR('/api/posts?range=90', fetcher);
  const { data: config } = useSWR<{ mentionBonusMultiplier?: number }>('/api/config', fetcher);
  const mentionMultiplier = config?.mentionBonusMultiplier ?? 2.0;

  // ── Overview tab data ──
  const gridData = useMemo(() => {
    if (!employees || !streaks || !posts30) return [];

    const streakMap: Record<string, { currentStreak: number; isActive: boolean }> = {};
    for (const s of streaks) {
      streakMap[s.employeeId] = { currentStreak: s.currentStreak, isActive: s.isActive };
    }

    const now = new Date();
    const weeklyPosts: Record<string, number[]> = {};
    for (const e of employees) weeklyPosts[e.id] = [0, 0, 0, 0];
    for (const p of posts30) {
      const diff = Math.floor((now.getTime() - new Date(p.publishedAt).getTime()) / (7 * 86400000));
      if (diff < 4 && weeklyPosts[p.authorId]) weeklyPosts[p.authorId][3 - diff]++;
    }

    const postCounts: Record<string, number> = {};
    const lastPostDates: Record<string, string> = {};
    for (const p of posts30) {
      postCounts[p.authorId] = (postCounts[p.authorId] || 0) + 1;
      if (!lastPostDates[p.authorId] || p.publishedAt > lastPostDates[p.authorId]) {
        lastPostDates[p.authorId] = p.publishedAt;
      }
    }

    const now2 = new Date();
    let result = employees.map((e: AnyEmployee) => {
      const lastPost = lastPostDates[e.id];
      const daysSinceLastPost = lastPost
        ? Math.floor((now2.getTime() - new Date(lastPost).getTime()) / 86400000)
        : null;
      return {
        id: e.id,
        fullName: e.fullName,
        jobTitle: e.jobTitle,
        department: e.department,
        avatarUrl: e.avatarUrl,
        streak: streakMap[e.id]?.currentStreak || 0,
        isStreakActive: streakMap[e.id]?.isActive || false,
        recentWeeks: weeklyPosts[e.id] || [0, 0, 0, 0],
        totalPosts: postCounts[e.id] || 0,
        lastPostDate: lastPostDates[e.id] || '',
        daysSinceLastPost,
        status: getStatus(daysSinceLastPost),
      };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e: AnyEmployee) =>
        e.fullName.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((e: AnyEmployee) => e.status === statusFilter);
    }

    result.sort((a: AnyEmployee, b: AnyEmployee) => a.fullName.localeCompare(b.fullName));

    return result;
  }, [employees, streaks, posts30, searchQuery, statusFilter]);

  // ── Status counts (unfiltered) ──
  const statusCounts = useMemo(() => {
    if (!employees || !posts30) return {} as Record<Status, number>;
    const now2 = new Date();
    const lastPostDates2: Record<string, string> = {};
    for (const p of posts30) {
      if (!lastPostDates2[p.authorId] || p.publishedAt > lastPostDates2[p.authorId]) {
        lastPostDates2[p.authorId] = p.publishedAt;
      }
    }
    const counts: Record<Status, number> = { healthy: 0, starving: 0, dormant: 0, quiet: 0 };
    for (const e of employees) {
      const lastPost = lastPostDates2[e.id];
      const days = lastPost ? Math.floor((now2.getTime() - new Date(lastPost).getTime()) / 86400000) : null;
      counts[getStatus(days)]++;
    }
    return counts;
  }, [employees, posts30]);

  // ── Leaderboard tab data ──
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    if (!employees || !allPosts) return [];

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const empMap: Record<string, AnyEmployee> = {};
    for (const e of employees) empMap[e.id] = e;

    // Build start date map for filtering pre-employment posts
    const startDateMap: Record<string, Date | null> = {};
    for (const e of employees) {
      startDateMap[e.id] = e.companyStartDate ? new Date(e.companyStartDate) : null;
    }

    // Group posts by employee, filtering out posts before company start date
    const postsByEmployee: Record<string, AnyPost[]> = {};
    for (const e of employees) postsByEmployee[e.id] = [];
    for (const p of allPosts) {
      if (!postsByEmployee[p.authorId]) continue;
      const startDate = startDateMap[p.authorId];
      if (startDate && new Date(p.publishedAt) < startDate) continue;
      postsByEmployee[p.authorId].push(p);
    }

    function calcPoints(post: AnyPost): number {
      const base = (post.engagement?.likes || 0) * 0.5 + (post.engagement?.comments || 0) * 2 + (post.engagement?.shares || 0) * 3;
      return post.mentionsCompany ? base * mentionMultiplier : base;
    }

    function calcConsecutiveDays(posts: AnyPost[]): number {
      if (posts.length === 0) return 0;
      const daysWithPosts = new Set<string>();
      for (const p of posts) {
        daysWithPosts.add(new Date(p.publishedAt).toISOString().split('T')[0]);
      }
      let streak = 0;
      const d = new Date(now);
      // Check if today or yesterday had a post to start the streak
      const todayStr = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 1);
      const yesterdayStr = d.toISOString().split('T')[0];

      if (!daysWithPosts.has(todayStr) && !daysWithPosts.has(yesterdayStr)) return 0;

      const checkDate = new Date(now);
      if (!daysWithPosts.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const key = checkDate.toISOString().split('T')[0];
        if (daysWithPosts.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }

    const entries: LeaderboardEntry[] = employees.map((e: AnyEmployee) => {
      const empPosts = postsByEmployee[e.id] || [];
      const totalPoints = empPosts.reduce((sum: number, p: AnyPost) => sum + calcPoints(p), 0);
      const weeklyPoints = empPosts
        .filter((p: AnyPost) => new Date(p.publishedAt) >= startOfWeek)
        .reduce((sum: number, p: AnyPost) => sum + calcPoints(p), 0);
      const points7d = empPosts
        .filter((p: AnyPost) => new Date(p.publishedAt) >= sevenDaysAgo)
        .reduce((sum: number, p: AnyPost) => sum + calcPoints(p), 0);
      const points30d = empPosts
        .filter((p: AnyPost) => new Date(p.publishedAt) >= thirtyDaysAgo)
        .reduce((sum: number, p: AnyPost) => sum + calcPoints(p), 0);

      // Days since last post
      const sortedPosts = [...empPosts].sort((a: AnyPost, b: AnyPost) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      const lastPost = sortedPosts[0];
      const daysSinceLastPost = lastPost
        ? Math.floor((now.getTime() - new Date(lastPost.publishedAt).getTime()) / 86400000)
        : null;

      return {
        id: e.id,
        fullName: e.fullName,
        avatarUrl: e.avatarUrl,
        daysSinceLastPost,
        consecutiveDays: calcConsecutiveDays(empPosts),
        weeklyPoints,
        totalPoints,
        points30d,
        points7d,
      };
    });

    // Sort by total points descending
    entries.sort((a, b) => b.totalPoints - a.totalPoints);

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return entries.filter(e => e.fullName.toLowerCase().includes(q));
    }

    return entries;
  }, [employees, allPosts, searchQuery, mentionMultiplier]);

  // ── All Posts tab data ──
  const allPostsData = useMemo((): PostEntry[] => {
    if (!employees || !allPosts) return [];

    const empMap: Record<string, { fullName: string; avatarUrl: string }> = {};
    for (const e of employees) empMap[e.id] = { fullName: e.fullName, avatarUrl: e.avatarUrl };

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - postsTimeRange);

    let result: PostEntry[] = allPosts
      .filter((p: AnyPost) => new Date(p.publishedAt) >= cutoff && empMap[p.authorId])
      .map((p: AnyPost) => {
        const emp = empMap[p.authorId];
        return {
          id: p.id,
          authorName: emp.fullName,
          authorAvatar: emp.avatarUrl,
          textContent: p.textContent,
          publishedAt: p.publishedAt,
          likes: p.engagement?.likes || 0,
          comments: p.engagement?.comments || 0,
          shares: p.engagement?.shares || 0,
          postUrl: p.url,
        };
      })
      .sort((a: PostEntry, b: PostEntry) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => p.authorName.toLowerCase().includes(q) || p.textContent.toLowerCase().includes(q)
      );
    }

    return result;
  }, [employees, allPosts, searchQuery, postsTimeRange]);

  const isLoading = empLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" accentLabel="Team" icon={Users} statValue={employees?.length} statLabel="members" />

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setEmployeeTab(tab.value)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              employeeTab === tab.value
                ? 'bg-white text-black'
                : 'bg-elevated text-neutral-300 hover:bg-highlight hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar + time range filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder={
              employeeTab === 'posts'
                ? 'Search posts or posters...'
                : 'Search employees...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-elevated rounded-full py-3 pl-12 pr-4 text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-linkify-green transition-all"
          />
        </div>
        {employeeTab === 'posts' && (
          <div className="flex gap-1 flex-shrink-0">
            {POST_TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setPostsTimeRange(range.value)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  postsTimeRange === range.value
                    ? 'bg-white text-black'
                    : 'bg-elevated text-neutral-300 hover:bg-highlight hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      {employeeTab === 'overview' && (
        <>
          {/* Status Album Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUS_ALBUMS.map(({ status, album, subtitle, gradient }) => {
              const count = statusCounts[status] ?? 0;
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(isActive ? null : status)}
                  className={`relative overflow-hidden rounded-lg p-5 text-left transition-all duration-200 group ${
                    isActive
                      ? 'ring-2 ring-white scale-[1.02]'
                      : 'hover:scale-[1.02] hover:brightness-110'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-sm font-semibold text-white/90 mt-1">{album}</p>
                    <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {statusFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">
                Filtered by: <span className="text-white font-medium">{STATUS_ALBUMS.find(a => a.status === statusFilter)?.album}</span>
              </span>
              <button
                onClick={() => setStatusFilter(null)}
                className="text-xs text-neutral-400 hover:text-white transition-colors underline"
              >
                Clear
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} variant="card" className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <EmployeeGrid employees={gridData} />
          )}
        </>
      )}

      {employeeTab === 'leaderboard' && (
        isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-16" />
            ))}
          </div>
        ) : (
          <EmployeeLeaderboard entries={leaderboardData} mentionMultiplier={mentionMultiplier} />
        )
      )}

      {employeeTab === 'posts' && (
        isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-14" />
            ))}
          </div>
        ) : (
          <AllPostsTable posts={allPostsData} />
        )
      )}
    </div>
  );
}
