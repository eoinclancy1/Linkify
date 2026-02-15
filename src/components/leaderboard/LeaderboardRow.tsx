'use client';

import Link from 'next/link';
import RankMedal from '@/components/ui/RankMedal';
import Avatar from '@/components/ui/Avatar';
import EngagementBadge from '@/components/leaderboard/EngagementBadge';

interface LeaderboardRowProps {
  rank: number;
  authorName: string;
  authorAvatar: string | null;
  postExcerpt: string;
  likes: number;
  comments: number;
  shares: number;
  engagementScore: number;
  postUrl: string;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export default function LeaderboardRow({
  rank,
  authorName,
  authorAvatar,
  postExcerpt,
  likes,
  comments,
  shares,
  engagementScore,
  postUrl,
}: LeaderboardRowProps) {
  return (
    <Link
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 bg-surface hover:bg-elevated transition-all hover:translate-x-1 rounded-lg p-4"
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 flex justify-center">
        <RankMedal rank={rank} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-shrink-0 w-44">
        <Avatar src={authorAvatar} name={authorName} size="sm" />
        <span className="text-sm font-medium text-white truncate">{authorName}</span>
      </div>

      {/* Post excerpt */}
      <p className="flex-1 text-sm text-neutral-300 truncate min-w-0">
        {truncate(postExcerpt, 120)}
      </p>

      {/* Engagement badges */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <EngagementBadge type="likes" count={likes} />
        <EngagementBadge type="comments" count={comments} />
        <EngagementBadge type="shares" count={shares} />
      </div>

      {/* Total score */}
      <div className="flex-shrink-0 w-16 text-right">
        <span className="text-sm font-bold text-linkify-green">{engagementScore}</span>
      </div>
    </Link>
  );
}
