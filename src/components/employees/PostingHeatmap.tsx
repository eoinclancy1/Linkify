'use client';

interface Activity {
  date: string;
  postCount: number;
}

interface PostingHeatmapProps {
  activities: Activity[];
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCellColor(postCount: number): string {
  if (postCount === 0) return 'bg-elevated';
  if (postCount === 1) return 'bg-linkify-green/20';
  if (postCount === 2) return 'bg-linkify-green/40';
  return 'bg-linkify-green/80';
}

function buildHeatmapData(activities: Activity[]): { grid: (Activity | null)[][]; monthLabels: { label: string; col: number }[] } {
  const activityMap = new Map<string, number>();
  for (const a of activities) {
    activityMap.set(a.date, a.postCount);
  }

  // Build 52 weeks ending today
  const today = new Date();
  const endDate = new Date(today);
  const dayOfWeek = endDate.getDay(); // 0=Sun

  // Go back to the start: 52 weeks ago, aligned to Sunday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (51 * 7 + dayOfWeek));

  const grid: (Activity | null)[][] = [];
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < 52; week++) {
    const column: (Activity | null)[] = [];

    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + week * 7 + day);

      if (cellDate > today) {
        column.push(null);
        continue;
      }

      const dateStr = cellDate.toISOString().split('T')[0];
      const postCount = activityMap.get(dateStr) ?? 0;
      column.push({ date: dateStr, postCount });

      // Track month labels on first day of each week
      if (day === 0) {
        const month = cellDate.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTH_LABELS[month], col: week });
          lastMonth = month;
        }
      }
    }

    grid.push(column);
  }

  return { grid, monthLabels };
}

export default function PostingHeatmap({ activities }: PostingHeatmapProps) {
  const { grid, monthLabels } = buildHeatmapData(activities);

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex ml-8 mb-1 gap-1">
        {Array.from({ length: 52 }).map((_, i) => {
          const label = monthLabels.find((m) => m.col === i);
          return (
            <div key={i} className="w-3 text-xs text-neutral-500 shrink-0">
              {label ? label.label : ''}
            </div>
          );
        })}
      </div>

      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 text-xs text-neutral-500 leading-3 w-6 text-right pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {grid.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((cell, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-3 h-3 rounded-sm ${cell ? getCellColor(cell.postCount) : 'bg-transparent'}`}
                  title={cell ? `${cell.date}: ${cell.postCount} post${cell.postCount !== 1 ? 's' : ''}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
