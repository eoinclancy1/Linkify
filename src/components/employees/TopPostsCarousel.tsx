'use client';

import React, { useMemo, useRef } from 'react';
import { Heart, MessageCircle, Share2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { PostEntry } from '@/components/employees/AllPostsTable';

interface TopPostsCarouselProps {
  posts: PostEntry[];
}

const CARD_STYLES = [
  { bg: 'linear-gradient(135deg, #1e0a40 0%, #3d1078 100%)', accent: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  { bg: 'linear-gradient(135deg, #0a2e1a 0%, #14532d 100%)', accent: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  { bg: 'linear-gradient(135deg, #2e1a0a 0%, #78350f 100%)', accent: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  { bg: 'linear-gradient(135deg, #0a1a2e 0%, #1e3a5f 100%)', accent: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  { bg: 'linear-gradient(135deg, #2e0a1a 0%, #7f1d1d 100%)', accent: '#f87171', border: 'rgba(248,113,113,0.2)' },
  { bg: 'linear-gradient(135deg, #1a1a0a 0%, #3d3000 100%)', accent: '#facc15', border: 'rgba(250,204,21,0.2)' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TopPostsCarousel({ posts }: TopPostsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const topPosts = useMemo(() => {
    const scored = posts.map(p => ({ ...p, score: p.likes + p.comments * 2 + p.shares * 3 }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  }, [posts]);

  if (topPosts.length === 0) return null;

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -288 : 288, behavior: 'smooth' });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Top Posts</p>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-neutral-400 hover:text-white hover:bg-highlight transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-neutral-400 hover:text-white hover:bg-highlight transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {topPosts.map((post, index) => {
          const style = CARD_STYLES[index % CARD_STYLES.length];
          const snippet = post.textContent.length > 180
            ? post.textContent.slice(0, 180).trimEnd() + '…'
            : post.textContent;

          return (
            <div
              key={post.id}
              className="flex-shrink-0 w-64 rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                scrollSnapAlign: 'start',
              }}
            >
              {/* Header */}
              <div className="p-5 pb-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="rounded-full flex-shrink-0 ring-2"
                    style={{ '--tw-ring-color': style.accent } as React.CSSProperties}
                  >
                    <Avatar src={post.authorAvatar} name={post.authorName} size="lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm leading-tight truncate">{post.authorName}</p>
                    {post.publishedAt && (
                      <p className="text-xs mt-0.5" style={{ color: style.accent }}>
                        {formatDate(post.publishedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Post snippet */}
                <p className="text-xs text-white/75 leading-relaxed flex-1">{snippet}</p>
              </div>

              {/* Stats footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${style.border}` }}
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1" style={{ color: style.accent }}>
                    <Heart className="w-3.5 h-3.5" />
                    {post.likes.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/50">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {post.comments.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/50">
                    <Share2 className="w-3.5 h-3.5" />
                    {post.shares.toLocaleString()}
                  </span>
                </div>
                {post.postUrl && (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
