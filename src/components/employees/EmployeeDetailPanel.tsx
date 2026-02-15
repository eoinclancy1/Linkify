'use client';

import { Flame, Trophy, FileText, TrendingUp } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { Employee, PostingStreak } from '@/types';

interface EmployeeDetailPanelProps {
  employee: Employee;
  streak: PostingStreak;
  posts30dCount: number;
  avgEngagement: number;
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

export default function EmployeeDetailPanel({ employee, streak, posts30dCount, avgEngagement }: EmployeeDetailPanelProps) {
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
          value={posts30dCount}
        />
        <StatItem
          icon={<TrendingUp className="h-5 w-5 text-linkify-green" />}
          label="Avg Engagement"
          value={avgEngagement}
        />
      </div>
    </div>
  );
}
