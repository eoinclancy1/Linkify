'use client';

import Avatar from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface PostRowProps {
  authorName: string;
  authorAvatar: string;
  textContent: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  postUrl: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export default function PostRow({
  authorName,
  authorAvatar,
  textContent,
  publishedAt,
  likes,
  comments,
  shares,
  postUrl,
}: PostRowProps) {
  return (
    <div className="flex items-center gap-4 bg-surface hover:bg-elevated transition-all rounded-lg p-4">
      {/* Poster */}
      <div className="flex items-center gap-2 flex-shrink-0 w-40">
        <Avatar src={authorAvatar} name={authorName} size="sm" />
        <span className="text-sm font-medium text-white truncate">{authorName}</span>
      </div>

      {/* Post preview */}
      <p className="flex-1 text-sm text-neutral-300 truncate min-w-0" title={textContent}>
        {truncate(textContent, 100)}
      </p>

      {/* Date */}
      <div className="flex-shrink-0 w-28 text-sm text-neutral-400">
        {formatDate(publishedAt)}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-1 flex-shrink-0 w-16 text-sm text-neutral-400">
        <Heart className="w-3.5 h-3.5" />
        <span>{likes}</span>
      </div>

      {/* Comments */}
      <div className="flex items-center gap-1 flex-shrink-0 w-16 text-sm text-neutral-400">
        <MessageCircle className="w-3.5 h-3.5" />
        <span>{comments}</span>
      </div>

      {/* Shares */}
      <div className="flex items-center gap-1 flex-shrink-0 w-16 text-sm text-neutral-400">
        <Share2 className="w-3.5 h-3.5" />
        <span>{shares}</span>
      </div>

      {/* Link */}
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-lg hover:scale-110 transition-transform"
        title="View on LinkedIn"
      >
        🔗
      </a>
    </div>
  );
}
