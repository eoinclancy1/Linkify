'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface TopPoster {
  id: string;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
  streak: number;
}

interface TopPostersWidgetProps {
  employees: TopPoster[];
}

export default function TopPostersWidget({ employees }: TopPostersWidgetProps) {
  return (
    <div className="bg-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Top Posters</h2>
        <Link
          href="/employees"
          className="text-sm text-linkify-green hover:text-linkify-green-hover transition-colors"
        >
          See all
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {employees.map((employee) => (
          <Link
            key={employee.id}
            href={`/employees/${employee.id}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-lg bg-elevated hover:bg-highlight transition-colors min-w-[140px]"
          >
            <Avatar src={employee.avatarUrl} name={employee.fullName} size="lg" />
            <p className="text-sm font-medium text-white text-center truncate w-full">
              {employee.fullName}
            </p>
            <p className="text-xs text-neutral-400 text-center truncate w-full">
              {employee.jobTitle}
            </p>
            {employee.streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-orange-400 bg-orange-400/10 rounded-full px-2 py-0.5">
                <Flame className="w-3 h-3" />
                {employee.streak}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
