'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { PostEntry } from '@/components/employees/AllPostsTable';

interface TopPostsCarouselProps {
  posts: PostEntry[];
}

interface Spotlight {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  post: PostEntry | null;
  statValue: number;
  statLabel: string;
}

export default function TopPostsCarousel({ posts }: TopPostsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const spotlights = useMemo((): Spotlight[] => {
    const mostReacted = posts.length > 0
      ? posts.reduce((best, p) => p.likes > best.likes ? p : best, posts[0])
      : null;
    const mostCommented = posts.length > 0
      ? posts.reduce((best, p) => p.comments > best.comments ? p : best, posts[0])
      : null;
    const mostShared = posts.length > 0
      ? posts.reduce((best, p) => p.shares > best.shares ? p : best, posts[0])
      : null;

    return [
      {
        title: 'Crowd Favorite',
        subtitle: 'Most reactions on a single post',
        icon: <Heart className="w-5 h-5" />,
        accentColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        bgColor: 'bg-red-500/10',
        post: mostReacted,
        statValue: mostReacted?.likes ?? 0,
        statLabel: 'reactions',
      },
      {
        title: 'Conversation Starter',
        subtitle: 'Most comments on a single post',
        icon: <MessageCircle className="w-5 h-5" />,
        accentColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgColor: 'bg-blue-500/10',
        post: mostCommented,
        statValue: mostCommented?.comments ?? 0,
        statLabel: 'comments',
      },
      {
        title: 'Viral Hit',
        subtitle: 'Most shares on a single post',
        icon: <Share2 className="w-5 h-5" />,
        accentColor: 'text-linkify-green',
        borderColor: 'border-linkify-green/30',
        bgColor: 'bg-linkify-green/10',
        post: mostShared,
        statValue: mostShared?.shares ?? 0,
        statLabel: 'shares',
      },
    ];
  }, [posts]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(i => (i + 1) % spotlights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [spotlights.length]);

  if (posts.length === 0) return null;

  const current = spotlights[activeIndex];
  const post = current.post;
  if (!post) return null;

  const truncated = post.textContent.length > 140
    ? post.textContent.slice(0, 140).trimEnd() + '...'
    : post.textContent;

  return (
    <div className="space-y-3">
      {/* Card */}
      <div className={`bg-surface border ${current.borderColor} rounded-lg p-5 transition-all duration-500`}>
        <div className="flex items-start gap-4">
          {/* Icon + Title */}
          <div className={`flex-shrink-0 p-3 rounded-full ${current.bgColor} ${current.accentColor}`}>
            {current.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${current.accentColor}`}>
                {current.title}
              </h3>
              <span className="text-xs text-neutral-500">{current.subtitle}</span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
              <span className="text-sm font-medium text-white">{post.authorName}</span>
            </div>

            {/* Post excerpt */}
            <p className="text-sm text-neutral-300 leading-relaxed">{truncated}</p>
          </div>

          {/* Stat */}
          <div className="flex-shrink-0 text-right">
            <p className={`text-3xl font-bold ${current.accentColor}`}>{current.statValue.toLocaleString()}</p>
            <p className="text-xs text-neutral-400">{current.statLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation dots + arrows */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setActiveIndex(i => (i - 1 + spotlights.length) % spotlights.length)}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {spotlights.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? `${s.accentColor} scale-125` : 'bg-neutral-600 hover:bg-neutral-400'
            }`}
            style={i === activeIndex ? { backgroundColor: 'currentColor' } : undefined}
          />
        ))}

        <button
          onClick={() => setActiveIndex(i => (i + 1) % spotlights.length)}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
