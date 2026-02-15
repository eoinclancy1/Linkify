'use client';

import { use } from 'react';
import EmployeeDetailPanel from '@/components/employees/EmployeeDetailPanel';
import PostingHeatmap from '@/components/employees/PostingHeatmap';
import PostFrequencyChart from '@/components/employees/PostFrequencyChart';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
        recentPosts={posts?.slice(0, 10) || []}
      />

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
    </div>
  );
}
