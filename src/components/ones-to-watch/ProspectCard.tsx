'use client';

import { ExternalLink } from 'lucide-react';
import { Heart } from 'lucide-react';

interface ProspectCardProps {
  name: string;
  headline: string;
  avatarUrl: string;
  likes: number;
  postUrl: string;
}

export default function ProspectCard({ name, headline, avatarUrl, likes, postUrl }: ProspectCardProps) {
  return (
    <a href={postUrl} target="_blank" rel="noopener noreferrer">
      <div className="bg-surface rounded-lg p-4 hover:bg-elevated transition-all duration-300 group cursor-pointer">
        {/* Square image with hover link button */}
        <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden shadow-lg bg-elevated">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900">
              <span className="text-3xl font-bold text-neutral-400">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* External link button - appears on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-linkify-green flex items-center justify-center shadow-xl shadow-black/50 hover:scale-105 hover:bg-linkify-green-hover transition-transform">
              <ExternalLink className="w-5 h-5 text-black" />
            </div>
          </div>
        </div>

        {/* Text below image */}
        <p className="font-bold text-white truncate text-sm">{name}</p>
        <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{headline}</p>
        <div className="flex items-center gap-1 mt-2 text-neutral-400">
          <Heart className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{likes.toLocaleString()}</span>
        </div>
      </div>
    </a>
  );
}
