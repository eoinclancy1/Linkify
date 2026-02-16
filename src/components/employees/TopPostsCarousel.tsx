'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { PostEntry } from '@/components/employees/AllPostsTable';

interface TopPostsCarouselProps {
  posts: PostEntry[];
}

interface Spotlight {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentHex: string;
  glowColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
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
        accentHex: '#f87171',
        glowColor: 'bg-red-500/8',
        gradientFrom: 'from-[#2e0a0a]',
        gradientVia: 'via-[#3b0d0d]',
        gradientTo: 'to-[#532014]',
        post: mostReacted,
        statValue: mostReacted?.likes ?? 0,
        statLabel: 'reactions',
      },
      {
        title: 'Conversation Starter',
        subtitle: 'Most comments on a single post',
        icon: <MessageCircle className="w-5 h-5" />,
        accentHex: '#60a5fa',
        glowColor: 'bg-blue-500/8',
        gradientFrom: 'from-[#0a1a2e]',
        gradientVia: 'via-[#0d2440]',
        gradientTo: 'to-[#143053]',
        post: mostCommented,
        statValue: mostCommented?.comments ?? 0,
        statLabel: 'comments',
      },
      {
        title: 'Viral Hit',
        subtitle: 'Most shares on a single post',
        icon: <Share2 className="w-5 h-5" />,
        accentHex: '#1DB954',
        glowColor: 'bg-[#22c55e]/6',
        gradientFrom: 'from-[#0a2e1a]',
        gradientVia: 'via-[#0d3b20]',
        gradientTo: 'to-[#14532d]',
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

  const truncated = post.textContent.length > 160
    ? post.textContent.slice(0, 160).trimEnd() + '...'
    : post.textContent;

  return (
    <div className="space-y-3">
      {/* Card */}
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${current.gradientFrom} ${current.gradientVia} ${current.gradientTo} transition-all duration-700`}
      >
        {/* Ambient glow effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div
          className={`absolute -top-20 -right-20 w-64 h-64 ${current.glowColor} rounded-full blur-3xl`}
        />
        <div
          className={`absolute -bottom-12 -left-12 w-48 h-48 ${current.glowColor} rounded-full blur-3xl`}
        />

        <div className="relative flex items-center gap-6 p-6">
          {/* Avatar block */}
          <div className="flex-shrink-0 rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
            <Avatar
              src={post.authorAvatar}
              name={post.authorName}
              size="xl"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: current.accentHex }}
              >
                {current.icon}
                {current.title}
              </span>
              <span className="text-xs text-neutral-500">{current.subtitle}</span>
            </div>

            <p className="text-sm font-medium text-white mb-1">{post.authorName}</p>
            <p className="text-sm text-neutral-300 leading-relaxed">{truncated}</p>

            {/* Engagement row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {post.likes.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comments.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                {post.shares.toLocaleString()}
              </span>
              <a
                href={post.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-linkify-green hover:underline"
              >
                View on LinkedIn
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Hero stat */}
          <div className="flex-shrink-0 text-right">
            <p
              className="text-5xl font-extrabold tracking-tight"
              style={{ color: current.accentHex }}
            >
              {current.statValue.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-400 uppercase tracking-wide mt-1">{current.statLabel}</p>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="h-4 bg-gradient-to-b from-transparent to-[#121212]" />
      </div>

      {/* Navigation dots + arrows */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setActiveIndex(i => (i - 1 + spotlights.length) % spotlights.length)}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {spotlights.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor: i === activeIndex ? current.accentHex : '#525252',
              transform: i === activeIndex ? 'scale(1.25)' : 'scale(1)',
            }}
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
