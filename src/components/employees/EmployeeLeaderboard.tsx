'use client';

import { useState, useMemo } from 'react';
import { Trophy, Heart, MessageCircle, Share2, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import Image from 'next/image';
import EmployeeLeaderboardRow from '@/components/employees/EmployeeLeaderboardRow';

export interface LeaderboardEntry {
  id: string;
  fullName: string;
  avatarUrl: string;
  daysSinceLastPost: number | null;
  consecutiveDays: number;
  weeklyPoints: number;
  totalPoints: number;
  points30d: number;
}

type SortColumn = 'streak' | 'weekly' | 'total';
type SortDirection = 'asc' | 'desc';

interface EmployeeLeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function EmployeeLeaderboard({ entries }: EmployeeLeaderboardProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Find 30-day champion
  const champion = entries.reduce<LeaderboardEntry | null>((best, entry) => {
    if (!best || entry.points30d > best.points30d) return entry;
    return best;
  }, null);

  const totalPoints = entries.reduce((sum, e) => sum + e.totalPoints, 0);
  const activeStreaks = entries.filter(e => e.consecutiveDays > 0).length;

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    sorted.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortColumn) {
        case 'streak':
          aVal = a.consecutiveDays;
          bVal = b.consecutiveDays;
          break;
        case 'weekly':
          aVal = a.weeklyPoints;
          bVal = b.weeklyPoints;
          break;
        case 'total':
          aVal = a.totalPoints;
          bVal = b.totalPoints;
          break;
      }
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [entries, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) return null;
    return sortDirection === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  }

  return (
    <div className="space-y-4">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d]">
        {/* Subtle grain / glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#4ade80]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#22c55e]/6 rounded-full blur-3xl" />

        <div className="relative flex items-end gap-6 p-8">
          {/* Album art — champion avatar or trophy icon */}
          <div className="flex-shrink-0 w-48 h-48 rounded-lg shadow-2xl shadow-black/60 overflow-hidden bg-gradient-to-br from-[#4ade80]/20 to-[#166534]/40">
            {champion && champion.points30d > 0 ? (
              <Image
                src={champion.avatarUrl}
                alt={champion.fullName}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-20 h-20 text-[#4ade80]/60" />
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80] mb-2">
              Leaderboard
            </p>
            <h1 className="text-6xl font-extrabold text-white tracking-tight leading-none mb-4">
              {champion && champion.points30d > 0 ? champion.fullName : 'Leaderboard'}
            </h1>

            <div className="flex items-center gap-3 text-sm text-neutral-300">
              {champion && champion.points30d > 0 && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#4ade80]" />
                    <span className="font-semibold text-white">30-Day Champion</span>
                  </span>
                  <span className="text-neutral-500">&middot;</span>
                  <span className="font-semibold text-[#4ade80]">{champion.points30d.toLocaleString()} pts</span>
                  <span className="text-neutral-500">&middot;</span>
                </>
              )}
              <span>{entries.length} employees</span>
              <span className="text-neutral-500">&middot;</span>
              <span>{totalPoints.toLocaleString()} total points</span>
              <span className="text-neutral-500">&middot;</span>
              <span>{activeStreaks} active streaks</span>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade into content */}
        <div className="h-8 bg-gradient-to-b from-transparent to-[#121212]" />
      </div>

      {/* Scoring formula bar */}
      <div className="sticky top-0 z-10 bg-elevated/95 backdrop-blur-sm rounded-lg px-4 py-2.5 flex items-center gap-4 text-xs text-neutral-400">
        <span className="font-semibold text-neutral-300 uppercase tracking-wider">Points =</span>
        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> Reactions <span className="text-white font-semibold">&times;0.5</span></span>
        <span className="text-neutral-600">+</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-400" /> Comments <span className="text-white font-semibold">&times;2</span></span>
        <span className="text-neutral-600">+</span>
        <span className="inline-flex items-center gap-1"><Share2 className="w-3 h-3 text-linkify-green" /> Shares <span className="text-white font-semibold">&times;3</span></span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-neutral-500 uppercase tracking-wider">
        <div className="flex-shrink-0 w-8 text-center">#</div>
        <div className="flex-1 min-w-0">Member</div>
        <div className="flex-shrink-0 w-24 text-right">Status</div>
        <button
          onClick={() => handleSort('streak')}
          className={`flex-shrink-0 w-24 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'streak' ? 'text-white' : ''}`}
        >
          Streak<SortIcon column="streak" />
        </button>
        <button
          onClick={() => handleSort('weekly')}
          className={`flex-shrink-0 w-24 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'weekly' ? 'text-white' : ''}`}
        >
          This Week<SortIcon column="weekly" />
        </button>
        <button
          onClick={() => handleSort('total')}
          className={`flex-shrink-0 w-24 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'total' ? 'text-white' : ''}`}
        >
          All Time<SortIcon column="total" />
        </button>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {sortedEntries.map((entry, i) => (
          <EmployeeLeaderboardRow
            key={entry.id}
            rank={i + 1}
            id={entry.id}
            fullName={entry.fullName}
            avatarUrl={entry.avatarUrl}
            daysSinceLastPost={entry.daysSinceLastPost}
            consecutiveDays={entry.consecutiveDays}
            weeklyPoints={entry.weeklyPoints}
            totalPoints={entry.totalPoints}
          />
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          No employee data available.
        </div>
      )}
    </div>
  );
}
