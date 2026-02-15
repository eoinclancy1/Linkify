import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface EngagementBadgeProps {
  type: 'likes' | 'comments' | 'shares';
  count: number;
}

const iconMap = {
  likes: Heart,
  comments: MessageCircle,
  shares: Share2,
};

export default function EngagementBadge({ type, count }: EngagementBadgeProps) {
  const Icon = iconMap[type];

  return (
    <span className="flex items-center gap-1 text-sm text-neutral-400">
      <Icon className="w-4 h-4" />
      {count}
    </span>
  );
}
