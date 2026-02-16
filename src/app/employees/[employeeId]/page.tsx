'use client';

import { use } from 'react';
import EmployeeDetailPanel from '@/components/employees/EmployeeDetailPanel';
import PostingHeatmap from '@/components/employees/PostingHeatmap';
import PostFrequencyChart from '@/components/employees/PostFrequencyChart';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Clock, TrendingUp, ThumbsUp, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import type { Post } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getExcerpt(text: string, maxLength = 140): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

function HeroPostCard({ post, label, icon, accentHex, gradientFrom, gradientVia, gradientTo, glowColor }: {
  post: Post | null;
  label: string;
  icon: React.ReactNode;
  accentHex: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  glowColor: string;
}) {
  if (!post) {
    return (
      <div className="bg-surface rounded-xl p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">{label}</h3>
        </div>
        <p className="text-neutral-500 text-sm flex-1">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${gradientFrom} ${gradientVia} ${gradientTo} bg-gradient-to-br rounded-xl overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${glowColor} rounded-full blur-3xl`} />
      <div className={`absolute -bottom-16 -left-16 w-36 h-36 ${glowColor} rounded-full blur-3xl`} />
      <div className="relative z-10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>{label}</h3>
          <span className="ml-auto text-xs text-neutral-500">{timeAgo(post.publishedAt)}</span>
        </div>

        <p className="text-sm text-neutral-200 leading-relaxed flex-1">
          {getExcerpt(post.textContent, 200)}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {post.engagement.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.engagement.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {post.engagement.shares}
          </span>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-linkify-green hover:underline"
          >
            View on LinkedIn
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="h-3 bg-gradient-to-b from-transparent to-[#121212]" />
    </div>
  );
}

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);

  const { data: employees } = useSWR('/api/employees', fetcher);
  const { data: streaks } = useSWR('/api/streaks', fetcher);
  const { data: posts } = useSWR(`/api/posts?employeeId=${employeeId}`, fetcher);
  const { data: activities } = useSWR(`/api/activity?employeeId=${employeeId}`, fetcher);

  const employee = employees?.find((e: { id: string }) => e.id === employeeId);
  const streak = streaks?.find((s: { employeeId: string }) => s.employeeId === employeeId);

  // Derived post data
  const sortedPosts: Post[] = posts
    ? [...posts].sort((a: Post, b: Post) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    : [];

  const mostRecentPost = sortedPosts.length > 0 ? sortedPosts[0] : null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const posts30d = sortedPosts.filter((p) => new Date(p.publishedAt) >= thirtyDaysAgo);

  const mostEngagedPost30d = posts30d.length > 0
    ? posts30d.reduce((best, p) => p.engagement.engagementScore > best.engagement.engagementScore ? p : best, posts30d[0])
    : null;

  const avgEngagement =
    sortedPosts.length > 0
      ? Math.round(sortedPosts.reduce((sum: number, p: Post) => sum + p.engagement.engagementScore, 0) / sortedPosts.length)
      : 0;

  // Build weekly frequency data for chart (last 12 weeks)
  const weeklyData = (() => {
    if (!posts) return [];
    const now = new Date();
    const weeks: { week: string; posts: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = posts.filter((p: { publishedAt: string }) => {
        const d = new Date(p.publishedAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({
        week: `W${12 - i}`,
        posts: count,
      });
    }
    return weeks;
  })();

  if (!employee) {
    return (
      <div className="space-y-6">
        <Link href="/employees" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/employees" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      <EmployeeDetailPanel
        employee={employee}
        streak={streak || { employeeId, currentStreak: 0, longestStreak: 0, streakUnit: 'week' as const, lastPostDate: '', isActive: false }}
        posts30dCount={posts30d.length}
        avgEngagement={avgEngagement}
      />

      {/* Hero Post Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeroPostCard
          post={mostRecentPost}
          label="Latest Release"
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          accentHex="#60a5fa"
          gradientFrom="from-[#0a1a2e]"
          gradientVia="via-[#0d2040]"
          gradientTo="to-[#14325d]"
          glowColor="bg-[#60a5fa]/8"
        />
        <HeroPostCard
          post={mostEngagedPost30d}
          label="What's Trending"
          icon={<TrendingUp className="h-4 w-4 text-linkify-green" />}
          accentHex="#4ade80"
          gradientFrom="from-[#0a2e1a]"
          gradientVia="via-[#0d3b20]"
          gradientTo="to-[#14532d]"
          glowColor="bg-[#4ade80]/8"
        />
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Posting Activity</h3>
          <PostingHeatmap activities={activities || []} />
        </div>
        <div className="bg-surface rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Post Frequency</h3>
          <PostFrequencyChart data={weeklyData} />
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Posts</h2>
        <div className="space-y-3">
          {sortedPosts.length === 0 && (
            <p className="text-neutral-400 text-sm">No recent posts to display.</p>
          )}
          {sortedPosts.slice(0, 10).map((post) => (
            <div key={post.id} className="bg-surface rounded-lg p-4">
              <p className="text-sm text-neutral-300">{getExcerpt(post.textContent)}</p>
              <p className="text-xs text-neutral-500 mt-2">{formatDate(post.publishedAt)}</p>

              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {post.engagement.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.engagement.comments}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Share2 className="h-3.5 w-3.5" />
                  {post.engagement.shares}
                </span>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-linkify-green hover:underline"
                >
                  View on LinkedIn
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
