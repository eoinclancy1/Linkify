'use client';

import Avatar from '@/components/ui/Avatar';

interface Activity {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  excerpt: string;
  timeAgo: string;
  mentionsCompany: boolean;
  type: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

function getActionText(type: string): string {
  switch (type) {
    case 'post':
      return 'published a post';
    case 'comment':
      return 'left a comment';
    case 'share':
      return 'shared a post';
    case 'like':
      return 'liked a post';
    default:
      return 'was active';
  }
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <div className="bg-surface rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>

      {activities.length === 0 ? (
        <p className="text-neutral-500 text-sm">No recent activity.</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-2">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.mentionsCompany ? 'bg-linkify-green' : 'bg-neutral-600'
                  }`}
                />
                <div className="w-px flex-1 bg-neutral-700 mt-1" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar
                    src={activity.authorAvatar}
                    name={activity.authorName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-white">
                      {activity.authorName}
                    </span>{' '}
                    <span className="text-sm text-neutral-400">
                      {getActionText(activity.type)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-neutral-300 ml-10">
                  {truncate(activity.excerpt, 100)}
                </p>

                <p className="text-xs text-neutral-500 mt-1 ml-10">{activity.timeAgo}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
