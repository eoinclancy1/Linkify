'use client';

import React from 'react';
import Link from 'next/link';
import RankMedal from '@/components/ui/RankMedal';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/employees/StatusBadge';

interface EmployeeLeaderboardRowProps {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl: string;
  daysSinceLastPost: number | null;
  consecutiveDays: number;
  weeklyPoints: number;
  points7d: number;
  totalPoints: number;
}

function renderStreak(days: number): React.ReactNode {
  if (days === 0) return <span className="text-neutral-500">—</span>;
  return <span className="inline-flex items-center gap-1">🔥<span className="text-neutral-300">×{days}</span></span>;
}

function formatTimeAgo(days: number | null): string {
  if (days === null) return 'No posts';
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export default function EmployeeLeaderboardRow({
  rank,
  id,
  fullName,
  avatarUrl,
  daysSinceLastPost,
  consecutiveDays,
  weeklyPoints,
  points7d,
  totalPoints,
}: EmployeeLeaderboardRowProps) {
  return (
    <Link
      href={`/employees/${id}`}
      className="flex items-center gap-4 bg-surface hover:bg-elevated transition-all hover:translate-x-1 rounded-lg p-4"
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 flex justify-center">
        <RankMedal rank={rank} />
      </div>

      {/* Member: Avatar + Name + Last post */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={avatarUrl} name={fullName} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{fullName}</p>
          <p className="text-xs text-neutral-500">{formatTimeAgo(daysSinceLastPost)}</p>
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 w-24 flex justify-end">
        <StatusBadge daysSinceLastPost={daysSinceLastPost} />
      </div>

      {/* Streak */}
      <div className="flex-shrink-0 w-24 text-right text-sm" title={`${consecutiveDays} day streak`}>
        {renderStreak(consecutiveDays)}
      </div>

      {/* Weekly Pts */}
      <div className="flex-shrink-0 w-24 text-right">
        <p className="text-sm font-semibold text-white">{weeklyPoints.toLocaleString()}</p>
      </div>

      {/* Last 7d Pts */}
      <div className="flex-shrink-0 w-24 text-right">
        <p className="text-sm font-semibold text-white">{points7d.toLocaleString()}</p>
      </div>

      {/* Total Pts */}
      <div className="flex-shrink-0 w-24 text-right">
        <p className="text-sm font-bold text-linkify-green">{totalPoints.toLocaleString()}</p>
      </div>
    </Link>
  );
}
