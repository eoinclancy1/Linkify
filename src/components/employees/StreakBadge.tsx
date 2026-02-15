'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  isActive: boolean;
}

export default function StreakBadge({ streak, isActive }: StreakBadgeProps) {
  const colorClass = isActive ? 'text-orange-400' : 'text-neutral-500';

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${colorClass}`}>
      <Flame className="h-4 w-4" />
      <span className="font-medium">{streak}</span>
      <span>weeks</span>
    </span>
  );
}
