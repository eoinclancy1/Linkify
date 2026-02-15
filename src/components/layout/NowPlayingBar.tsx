'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

export default function NowPlayingBar() {
  const { data: stats } = useSWR('/api/stats', fetcher, { refreshInterval: 60_000 });
  const { data: posts } = useSWR('/api/posts?range=7', fetcher, { refreshInterval: 60_000 });
  const { data: streaks } = useSWR('/api/streaks', fetcher, { refreshInterval: 60_000 });
  const { data: employees } = useSWR('/api/employees', fetcher, { refreshInterval: 60_000 });

  // Build ticker messages from real data
  const tickerMessages: string[] = [];

  if (posts && employees) {
    const empMap: Record<string, string> = {};
    for (const e of employees) empMap[e.id] = e.fullName;

    // Recent posts (last 7 days, sorted by date)
    const sorted = [...posts].sort(
      (a: AnyData, b: AnyData) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // "X posted about ..." for the 5 most recent posts
    for (const p of sorted.slice(0, 5)) {
      const name = empMap[p.authorId] ?? 'Someone';
      const snippet = p.textContent?.slice(0, 50) || 'a new post';
      tickerMessages.push(`${name} posted: "${snippet}..."`);
    }

    // Top post this week by likes
    const topPost = sorted.reduce(
      (best: AnyData | null, p: AnyData) =>
        !best || (p.engagement?.likes ?? 0) > (best.engagement?.likes ?? 0) ? p : best,
      null,
    );
    if (topPost && topPost.engagement?.likes >= 50) {
      const name = empMap[topPost.authorId] ?? 'Someone';
      tickerMessages.push(
        `${name}'s post reached ${topPost.engagement.likes.toLocaleString()} reactions this week!`,
      );
    }
  }

  if (streaks && employees) {
    const empNameMap: Record<string, string> = {};
    for (const e of employees) empNameMap[e.id] = e.fullName;

    // Longest active streak
    const active = streaks
      .filter((s: AnyData) => s.isActive && s.currentStreak > 1)
      .sort((a: AnyData, b: AnyData) => b.currentStreak - a.currentStreak);

    if (active.length > 0) {
      const top = active[0];
      const name = empNameMap[top.employeeId] ?? 'Someone';
      tickerMessages.push(`${name} is on a ${top.currentStreak}-week posting streak!`);
    }
  }

  if (stats) {
    if (stats.totalMentions30d > 0) {
      tickerMessages.push(`${stats.totalMentions30d} company mentions in the last 30 days`);
    }
    if (stats.avgEngagementScore > 0) {
      tickerMessages.push(`Average engagement score: ${stats.avgEngagementScore}`);
    }
  }

  // Stat pills
  const postsToday = posts
    ? posts.filter((p: AnyData) => {
        const today = new Date().toISOString().split('T')[0];
        return p.publishedAt?.startsWith(today);
      }).length
    : 0;

  const activeStreaks = streaks
    ? streaks.filter((s: AnyData) => s.isActive && s.currentStreak > 0).length
    : 0;

  const tickerText = tickerMessages.length > 0
    ? tickerMessages.join('  •  ')
    : 'Loading latest activity...';

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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-xs text-neutral-300">
          <span className="font-semibold text-white">{postsToday}</span>
          Posts today
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-xs text-neutral-300">
          <span className="font-semibold text-white">{activeStreaks}</span>
          Active streaks
        </span>
      </div>
    </footer>
  );
}
