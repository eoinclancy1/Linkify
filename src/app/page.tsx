'use client';

import StatCard from '@/components/dashboard/StatCard';
import TopPostersWidget from '@/components/dashboard/TopPostersWidget';
import EngagementTrendChart from '@/components/dashboard/EngagementTrendChart';
import MentionsChart from '@/components/dashboard/MentionsChart';
import EngagementBreakdownChart from '@/components/dashboard/EngagementBreakdownChart';
import RecentPostsTracklist from '@/components/dashboard/RecentPostsTracklist';
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
      .slice(0, 4)
      .map((e: { id: string; fullName: string; jobTitle: string; avatarUrl: string }) => ({
        id: e.id,
        fullName: e.fullName,
        jobTitle: e.jobTitle,
        avatarUrl: e.avatarUrl,
        streak: streakMap[e.id] || 0,
        postCount: postCounts[e.id] || 0,
      }));
  })();

  // Build engagement trend data (daily totals over 30 days)
  const engagementTrendData = (() => {
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

  // Build mentions chart data (weekly, stacked by employee vs external)
  const { mentionsChartData, totalMentions } = (() => {
    if (!mentions) return { mentionsChartData: [], totalMentions: 0 };
    const weekMap: Record<string, { employee: number; external: number }> = {};
    let total = 0;

    for (const m of mentions) {
      const postDate = m.post?.publishedAt;
      if (!postDate) continue;
      const d = new Date(postDate);
      if (isNaN(d.getTime())) continue;

      // Get ISO week start (Monday)
      const day = d.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mondayOffset);
      const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

      if (!weekMap[key]) weekMap[key] = { employee: 0, external: 0 };
      if (m.post?.isExternal) {
        weekMap[key].external++;
      } else {
        weekMap[key].employee++;
      }
      total++;
    }

    // Sort by date
    const sorted = Object.entries(weekMap)
      .sort(([a], [b]) => {
        const [am, ad] = a.split('/').map(Number);
        const [bm, bd] = b.split('/').map(Number);
        return am !== bm ? am - bm : ad - bd;
      })
      .map(([week, counts]) => ({
        week,
        employee: counts.employee,
        external: counts.external,
      }));

    return { mentionsChartData: sorted, totalMentions: total };
  })();

  // Build engagement breakdown data (likes, comments, shares totals)
  const { breakdownData, totalInteractions } = (() => {
    if (!posts) return { breakdownData: [], totalInteractions: 0 };
    let likes = 0, comments = 0, shares = 0;

    for (const p of posts) {
      const eng = p.engagement || {};
      likes += eng.likes || 0;
      comments += eng.comments || 0;
      shares += eng.shares || 0;
    }

    const total = likes + comments + shares;
    return {
      breakdownData: [
        { name: 'Likes', value: likes, color: '#1DB954' },
        { name: 'Comments', value: comments, color: '#f59e0b' },
        { name: 'Shares', value: shares, color: '#6366f1' },
      ],
      totalInteractions: total,
    };
  })();

  // Build recent posts tracklist data
  const recentPosts = (() => {
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
      .map((p: { id: string; authorId: string; textContent: string; publishedAt: string; mentionsCompany: boolean; type: string; url: string; mediaUrls?: string[]; engagement?: { likes?: number; comments?: number; shares?: number }; externalAuthorName?: string; externalAuthorAvatarUrl?: string }) => {
        const emp = empMap[p.authorId] || {
          fullName: p.externalAuthorName || 'Unknown',
          avatarUrl: p.externalAuthorAvatarUrl || '',
        };
        const now = Date.now();
        const diff = now - new Date(p.publishedAt).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const timeAgo = days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : 'now';
        return {
          id: p.id,
          authorName: emp.fullName,
          authorAvatar: emp.avatarUrl,
          excerpt: p.textContent.length > 80 ? p.textContent.slice(0, 80) + '...' : p.textContent,
          timeAgo,
          mentionsCompany: p.mentionsCompany,
          type: p.type,
          likes: p.engagement?.likes || 0,
          comments: p.engagement?.comments || 0,
          shares: p.engagement?.shares || 0,
          mediaUrl: p.mediaUrls?.[0] || null,
          url: p.url,
        };
      });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" className="h-72" />)}
        </div>
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
          hint="Number of LinkedIn posts published by your team in the last 30 days."
        />
        <StatCard
          title="What's Trending (30d)"
          value={stats?.totalMentions30d ?? 0}
          icon={AtSign}
          hint="Posts that mention your company, from both employees and external authors."
        />
        <StatCard
          title="Avg Engagement"
          value={stats?.avgEngagementScore ?? 0}
          icon={TrendingUp}
          hint="Average engagement score per post, calculated from likes, comments, and shares."
        />
        <StatCard
          title="Active Streaks"
          value={stats?.activeStreaks ?? 0}
          icon={Flame}
          hint="Employees who have posted at least once every week for consecutive weeks."
        />
      </div>

      <TopPostersWidget employees={topPosters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <EngagementTrendChart data={engagementTrendData} hint="Daily total engagement score across all posts over the last 30 days. The percentage shows week-over-week change." />
        <MentionsChart data={mentionsChartData} total={totalMentions} hint="Weekly count of posts mentioning your company, split by employee posts vs external authors." />
        <EngagementBreakdownChart data={breakdownData} total={totalInteractions} hint="Total likes, comments, and shares across all posts in the last 30 days." />
      </div>

      <RecentPostsTracklist posts={recentPosts} />
    </div>
  );
}
