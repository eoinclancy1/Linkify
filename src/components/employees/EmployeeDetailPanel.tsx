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
    <div className="bg-surface rounded-lg p-4 flex flex-col items-center gap-2 text-center relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-linkify-green/5 rounded-full blur-2xl" />
      <div className="relative text-neutral-400">{icon}</div>
      <span className="relative text-2xl font-extrabold text-white">{value}</span>
      <span className="relative text-xs text-neutral-400">{label}</span>
    </div>
  );
}

export default function EmployeeDetailPanel({ employee, streak, posts30dCount, avgEngagement }: EmployeeDetailPanelProps) {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#4ade80]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#22c55e]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#4ade80]/10 rounded-full blur-3xl" />
        <div className="relative z-10 p-8">
          <div className="flex flex-col items-center text-center">
            <Avatar src={employee.avatarUrl} name={employee.fullName} size="xl" className="ring-2 ring-[#4ade80]/20 shadow-2xl shadow-black/60" />
            <h1 className="mt-4 text-2xl font-extrabold text-white">{employee.fullName}</h1>
            <p className="mt-1 text-neutral-400">{employee.jobTitle}</p>
            <div className="mt-2">
              <Badge variant="neutral">{employee.department}</Badge>
            </div>
          </div>
        </div>
        <div className="h-6 bg-gradient-to-b from-transparent to-[#121212]" />
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
