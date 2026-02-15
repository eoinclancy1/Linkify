'use client';

import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';

interface LeaderboardMention {
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

interface LeaderboardTableProps {
  mentions: LeaderboardMention[];
}

export default function LeaderboardTable({ mentions }: LeaderboardTableProps) {
  if (mentions.length === 0) {
    return (
      <div className="bg-surface rounded-lg p-12 text-center">
        <p className="text-neutral-400 text-sm">
          No mentions found. Check back later for leaderboard updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mentions.map((mention) => (
        <LeaderboardRow
          key={`${mention.rank}-${mention.postUrl}`}
          rank={mention.rank}
          authorName={mention.authorName}
          authorAvatar={mention.authorAvatar}
          postExcerpt={mention.postExcerpt}
          likes={mention.likes}
          comments={mention.comments}
          shares={mention.shares}
          engagementScore={mention.engagementScore}
          postUrl={mention.postUrl}
        />
      ))}
    </div>
  );
}
