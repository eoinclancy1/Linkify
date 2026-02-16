'use client';

import StatCard from '@/components/dashboard/StatCard';
import TopPostersWidget from '@/components/dashboard/TopPostersWidget';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import EngagementChart from '@/components/dashboard/EngagementChart';
import Skeleton from '@/components/ui/Skeleton';
import { FileText, AtSign, TrendingUp, Flame } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR('/api/stats', fetcher);
  const { data: employees } = useSWR('/api/employees', fetcher);
  const { data: streaks } = useSWR('/api/streaks', fetcher);
  const { data: posts } = useSWR('/api/posts?range=30', fetcher);
  const { data: mentions } = useSWR('/api/mentions?range=30', fetcher);

  // Build top posters data
  const topPosters = (() => {
    if (!employees || !streaks || !posts) return [];
    const postCounts: Record<string, number> = {};
    for (const p of posts) {
      postCounts[p.authorId] = (postCounts[p.authorId] || 0) + 1;
    }
    const streakMap: Record<string, number> = {};
    for (const s of streaks) {
      streakMap[s.employeeId] = s.currentStreak;
    }
    return [...employees]
      .sort((a: { id: string }, b: { id: string }) => (postCounts[b.id] || 0) - (postCounts[a.id] || 0))
      .slice(0, 5)
      .map((e: { id: string; fullName: string; jobTitle: string; avatarUrl: string }) => ({
        id: e.id,
        fullName: e.fullName,
        jobTitle: e.jobTitle,
        avatarUrl: e.avatarUrl,
        streak: streakMap[e.id] || 0,
      }));
  })();

  // Build recent activity feed
  const recentActivities = (() => {
    if (!posts || !employees) return [];
    const empMap: Record<string, { fullName: string; avatarUrl: string }> = {};
    for (const e of employees) {
      empMap[e.id] = { fullName: e.fullName, avatarUrl: e.avatarUrl };
    }
    return [...posts]
      .sort((a: { publishedAt: string }, b: { publishedAt: string }) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 10)
      .map((p: { id: string; authorId: string; textContent: string; publishedAt: string; mentionsCompany: boolean; type: string }) => {
        const emp = empMap[p.authorId] || { fullName: 'Unknown', avatarUrl: '' };
        const now = Date.now();
        const diff = now - new Date(p.publishedAt).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const timeAgo = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : 'just now';
        return {
          id: p.id,
          authorName: emp.fullName,
          authorAvatar: emp.avatarUrl,
          excerpt: p.textContent.length > 100 ? p.textContent.slice(0, 100) + '...' : p.textContent,
          timeAgo,
          mentionsCompany: p.mentionsCompany,
          type: p.type,
        };
      });
  })();

  // Build engagement chart data
  const chartData = (() => {
    if (!posts) return [];
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const p of posts) {
      const key = new Date(p.publishedAt).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += p.engagement?.engagementScore || 0;
      }
    }
    return Object.entries(dailyMap).map(([date, engagement]) => ({ date, engagement }));
  })();

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="relative bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d] rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4ade80]/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#22c55e]/6 rounded-full blur-3xl" />
          <div className="relative z-10 pt-6 pb-1 px-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80] mb-1">Overview</p>
            <h1 className="text-4xl font-extrabold text-white">Dashboard</h1>
          </div>
          <div className="h-4 bg-gradient-to-b from-transparent to-[#121212]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4ade80]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#22c55e]/6 rounded-full blur-3xl" />
        <div className="relative z-10 pt-6 pb-1 px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80] mb-1">Overview</p>
          <h1 className="text-4xl font-extrabold text-white">Dashboard</h1>
          <div className="flex items-center gap-6 mt-2 text-sm text-neutral-300">
            <span><span className="font-bold text-white">{stats?.totalPosts30d ?? 0}</span> posts this month</span>
            <span><span className="font-bold text-white">{stats?.activeStreaks ?? 0}</span> active streaks</span>
          </div>
        </div>
        <div className="h-4 bg-gradient-to-b from-transparent to-[#121212]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Posts (30d)"
          value={stats?.totalPosts30d ?? 0}
          icon={FileText}
        />
        <StatCard
          title="What's Trending (30d)"
          value={stats?.totalMentions30d ?? 0}
          icon={AtSign}
        />
        <StatCard
          title="Avg Engagement"
          value={stats?.avgEngagementScore ?? 0}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Streaks"
          value={stats?.activeStreaks ?? 0}
          icon={Flame}
        />
      </div>

      <TopPostersWidget employees={topPosters} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed activities={recentActivities} />
        <EngagementChart data={chartData} />
      </div>
    </div>
  );
}
