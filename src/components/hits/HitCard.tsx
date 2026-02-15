'use client';

import Image from 'next/image';
import { Play, Heart } from 'lucide-react';

interface HitCardProps {
  avatarUrl: string;
  title: string;
  subtitle: string;
  likes: number;
  postUrl: string;
}

export default function HitCard({ avatarUrl, title, subtitle, likes, postUrl }: HitCardProps) {
  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-44 group"
    >
      <div className="bg-surface rounded-lg p-3 hover:bg-elevated transition-all duration-300">
        {/* Square image */}
        <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg">
          <Image
            src={avatarUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="176px"
          />

          {/* Play button on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-linkify-green flex items-center justify-center shadow-xl shadow-black/50 hover:scale-105 hover:bg-linkify-green-hover transition-transform">
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            </div>
          </div>

          {/* Likes badge */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            <span className="text-[10px] font-bold text-white">{likes.toLocaleString()}</span>
          </div>
        </div>

        {/* Text */}
        <p className="font-bold text-white text-sm truncate">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{subtitle}</p>
      </div>
    </a>
  );
}
