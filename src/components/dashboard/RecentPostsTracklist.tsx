'use client';

import { useState } from 'react';
import Image from 'next/image';
import Avatar from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2, AtSign, ExternalLink } from 'lucide-react';

interface TracklistPost {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  excerpt: string;
  timeAgo: string;
  mentionsCompany: boolean;
  type: string;
  likes: number;
  comments: number;
  shares: number;
  mediaUrl: string | null;
  url: string;
}

interface RecentPostsTracklistProps {
  posts: TracklistPost[];
}

function TrackRow({ post, index }: { post: TracklistPost; index: number }) {
  const [hovered, setHovered] = useState(false);
  const showImage = hovered && post.mediaUrl;

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-150 hover:bg-white/[0.06] cursor-pointer"
      style={{ gridTemplateColumns: '24px 48px 1fr auto auto' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Track number */}
      <span className="text-sm text-neutral-500 text-right tabular-nums group-hover:text-white transition-colors">
        {index + 1}
      </span>

      {/* Avatar / Image thumbnail */}
      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
        {showImage ? (
          <Image
            src={post.mediaUrl!}
            alt="Post media"
            fill
            className="object-cover animate-chart-fade-in"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar src={post.authorAvatar} name={post.authorName} size="md" />
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-linkify-green transition-colors">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {post.mentionsCompany && (
            <AtSign className="w-3 h-3 text-linkify-green flex-shrink-0" />
          )}
          <p className="text-xs text-neutral-400 truncate">{post.authorName}</p>
        </div>
      </div>

      {/* Engagement stats */}
      <div className="hidden sm:flex items-center gap-3 text-neutral-500">
        <span className="flex items-center gap-1 text-xs">
          <Heart className="w-3 h-3" />
          {post.likes.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <MessageCircle className="w-3 h-3" />
          {post.comments.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <Share2 className="w-3 h-3" />
          {post.shares.toLocaleString()}
        </span>
      </div>

      {/* Time + external link on hover */}
      <div className="flex items-center gap-2 min-w-[60px] justify-end">
        <span className="text-xs text-neutral-500 tabular-nums">{post.timeAgo}</span>
        <ExternalLink className="w-3.5 h-3.5 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

export default function RecentPostsTracklist({ posts }: RecentPostsTracklistProps) {
  return (
    <div className="bg-surface rounded-lg overflow-hidden relative">
      {/* Green accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-linkify-green/40 via-linkify-green/10 to-transparent" />
      {/* Glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-linkify-green/5 rounded-full blur-2xl" />

      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-baseline justify-between">
        <div>
          <p className="text-sm text-neutral-400">Recent Activity</p>
          <p className="text-2xl font-bold text-white mt-1">{posts.length} posts</p>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid items-center gap-3 px-4 py-2 border-b border-white/[0.06] text-xs text-neutral-500 uppercase tracking-wider"
        style={{ gridTemplateColumns: '24px 48px 1fr auto auto' }}
      >
        <span className="text-right">#</span>
        <span></span>
        <span>Post</span>
        <span className="hidden sm:block">Engagement</span>
        <span className="text-right">Time</span>
      </div>

      {/* Track rows */}
      <div className="py-1">
        {posts.length === 0 ? (
          <p className="text-neutral-500 text-sm py-8 text-center">No recent posts.</p>
        ) : (
          posts.map((post, i) => (
            <TrackRow key={post.id} post={post} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
