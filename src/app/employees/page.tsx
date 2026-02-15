'use client';

import EmployeeGrid from '@/components/employees/EmployeeGrid';
import EmployeeLeaderboard from '@/components/employees/EmployeeLeaderboard';
import type { LeaderboardEntry } from '@/components/employees/EmployeeLeaderboard';
import AllPostsTable from '@/components/employees/AllPostsTable';
import type { PostEntry } from '@/components/employees/AllPostsTable';
import Skeleton from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';
import useSWR from 'swr';
import { useAppStore } from '@/stores/app-store';
import { useState, useMemo } from 'react';

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

    let result = employees.map((e: AnyEmployee) => ({
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
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e: AnyEmployee) =>
        e.fullName.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }

    result.sort((a: AnyEmployee, b: AnyEmployee) => a.fullName.localeCompare(b.fullName));

    return result;
  }, [employees, streaks, posts30, searchQuery]);

  // ── Leaderboard tab data ──
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    if (!employees || !allPosts) return [];

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const empMap: Record<string, AnyEmployee> = {};
    for (const e of employees) empMap[e.id] = e;

    // Group posts by employee
    const postsByEmployee: Record<string, AnyPost[]> = {};
    for (const e of employees) postsByEmployee[e.id] = [];
    for (const p of allPosts) {
      if (postsByEmployee[p.authorId]) postsByEmployee[p.authorId].push(p);
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
      .filter((p: AnyPost) => new Date(p.publishedAt) >= cutoff)
      .map((p: AnyPost) => {
        const emp = empMap[p.authorId] || { fullName: 'Unknown', avatarUrl: '' };
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
      <h1 className="text-2xl font-bold">Employees</h1>

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
