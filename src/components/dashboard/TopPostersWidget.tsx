'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flame } from 'lucide-react';

const RANK_LABELS = ['Most Active', 'Runner Up', 'On Fire', 'Rising Star'];
const RANK_COLORS = [
  'bg-linkify-green text-black',
  'bg-cyan-400 text-black',
  'bg-yellow-300 text-black',
  'bg-pink-300 text-black',
];
const RANK_ACCENTS = [
  'bg-linkify-green',
  'bg-cyan-400',
  'bg-yellow-300',
  'bg-pink-300',
];

interface TopPoster {
  id: string;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
  streak: number;
  postCount: number;
}

interface TopPostersWidgetProps {
  employees: TopPoster[];
}

export default function TopPostersWidget({ employees }: TopPostersWidgetProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Top Posters This Month</h2>
        <Link
          href="/employees"
          className="text-sm text-linkify-green hover:text-linkify-green-hover transition-colors"
        >
          See all
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((employee, i) => (
          <Link
            key={employee.id}
            href={`/employees/${employee.id}`}
            className="group block"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-elevated">
              {employee.avatarUrl ? (
                <Image
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900">
                  <span className="text-4xl font-bold text-neutral-400">
                    {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Label overlay at bottom — Spotify mix style */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end">
                <div className="flex items-stretch">
                  <div className={`w-1 rounded-l-sm ${RANK_ACCENTS[i]}`} />
                  <span className={`px-2.5 py-1 text-sm font-bold rounded-r-sm ${RANK_COLORS[i]}`}>
                    {RANK_LABELS[i]}
                  </span>
                </div>
              </div>
            </div>

            {/* Info below image */}
            <div className="mt-2.5">
              <p className="text-sm font-semibold text-white truncate">{employee.fullName}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {employee.postCount} post{employee.postCount !== 1 ? 's' : ''} this month
                {employee.streak > 0 && (
                  <span
                    title={`Posted at least once per week for ${employee.streak} consecutive week${employee.streak === 1 ? '' : 's'}`}
                    className="inline-flex items-center gap-0.5 ml-1.5 text-orange-400"
                  >
                    <Flame className="w-3 h-3" />
                    {employee.streak}
                  </span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
