'use client';

import { Flame, Trophy, FileText, TrendingUp, ThumbsUp, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { Employee, PostingStreak, Post } from '@/types';

interface EmployeeDetailPanelProps {
  employee: Employee;
  streak: PostingStreak;
  recentPosts: Post[];
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="bg-surface rounded-lg p-4 flex flex-col items-center gap-2 text-center">
      <div className="text-neutral-400">{icon}</div>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  );
}

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

export default function EmployeeDetailPanel({ employee, streak, recentPosts }: EmployeeDetailPanelProps) {
  const posts30d = recentPosts.filter((p) => {
    const postDate = new Date(p.publishedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return postDate >= thirtyDaysAgo;
  });

  const avgEngagement =
    recentPosts.length > 0
      ? Math.round(recentPosts.reduce((sum, p) => sum + p.engagement.engagementScore, 0) / recentPosts.length)
      : 0;

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-linkify-green/20 to-transparent rounded-lg p-8">
        <div className="flex flex-col items-center text-center">
          <Avatar src={employee.avatarUrl} name={employee.fullName} size="xl" />
          <h1 className="mt-4 text-2xl font-bold text-white">{employee.fullName}</h1>
          <p className="mt-1 text-neutral-400">{employee.jobTitle}</p>
          <div className="mt-2">
            <Badge variant="neutral">{employee.department}</Badge>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatItem
          icon={<Flame className="h-5 w-5 text-orange-400" />}
          label="Current Streak"
          value={`${streak.currentStreak}w`}
        />
        <StatItem
          icon={<Trophy className="h-5 w-5 text-yellow-400" />}
          label="Longest Streak"
          value={`${streak.longestStreak}w`}
        />
        <StatItem
          icon={<FileText className="h-5 w-5 text-blue-400" />}
          label="Posts (30d)"
          value={posts30d.length}
        />
        <StatItem
          icon={<TrendingUp className="h-5 w-5 text-linkify-green" />}
          label="Avg Engagement"
          value={avgEngagement}
        />
      </div>

      {/* Recent Posts */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Posts</h2>
        <div className="space-y-3">
          {recentPosts.length === 0 && (
            <p className="text-neutral-400 text-sm">No recent posts to display.</p>
          )}
          {recentPosts.map((post) => (
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
