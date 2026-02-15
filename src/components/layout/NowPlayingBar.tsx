'use client';

interface NowPlayingBarProps {
  recentActivity: string[];
  stats: { label: string; value: string }[];
}

export default function NowPlayingBar({ recentActivity, stats }: NowPlayingBarProps) {
  const tickerText = recentActivity.join('  •  ');

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-highlight z-30 flex items-center px-4 md:pl-68">
      {/* Left side: ticker */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <span className="h-2 w-2 rounded-full bg-linkify-green shrink-0" />
        <span className="text-xs text-neutral-400 shrink-0">Latest:</span>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="animate-ticker inline-block">
            <span className="text-xs text-neutral-300">
              {tickerText}
            </span>
            <span className="text-xs text-neutral-300 ml-8">
              {tickerText}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: stat pills */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 ml-4">
        {stats.map((stat) => (
          <span
            key={stat.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-xs text-neutral-300"
          >
            <span className="font-semibold text-white">{stat.value}</span>
            {stat.label}
          </span>
        ))}
      </div>
    </footer>
  );
}
