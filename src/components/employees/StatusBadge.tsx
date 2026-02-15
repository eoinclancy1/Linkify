'use client';

type Status = 'healthy' | 'starving' | 'dormant' | 'quiet';

interface StatusBadgeProps {
  daysSinceLastPost: number | null;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-linkify-green/20 text-linkify-green',
  },
  starving: {
    label: 'Starving',
    className: 'bg-orange-500/20 text-orange-400',
  },
  dormant: {
    label: 'Dormant',
    className: 'bg-red-500/20 text-red-400',
  },
  quiet: {
    label: 'Quiet',
    className: 'bg-neutral-700/50 text-neutral-300',
  },
};

function getStatus(daysSinceLastPost: number | null): Status {
  if (daysSinceLastPost === null) return 'quiet';
  if (daysSinceLastPost <= 25) return 'healthy';
  if (daysSinceLastPost <= 29) return 'starving';
  return 'dormant';
}

export default function StatusBadge({ daysSinceLastPost }: StatusBadgeProps) {
  const status = getStatus(daysSinceLastPost);
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
