'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface EmployeeCardProps {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
  streak: number;
  isStreakActive: boolean;
  recentWeeks: number[];
}

export default function EmployeeCard({
  id,
  fullName,
  jobTitle,
  department,
  avatarUrl,
}: EmployeeCardProps) {
  return (
    <Link href={`/employees/${id}`}>
      <div className="bg-surface rounded-lg p-4 hover:bg-elevated transition-all duration-300 group cursor-pointer">
        {/* Square image with hover play button */}
        <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden shadow-lg bg-elevated">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900">
              <span className="text-3xl font-bold text-neutral-400">
                {fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Play button - appears on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-linkify-green flex items-center justify-center shadow-xl shadow-black/50 hover:scale-105 hover:bg-linkify-green-hover transition-transform">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </div>
        </div>

        {/* Text below image */}
        <p className="font-bold text-white truncate text-sm">{fullName}</p>
        <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{jobTitle} &middot; {department}</p>
      </div>
    </Link>
  );
}
