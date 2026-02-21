'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';

interface DataPoint {
  week: string;
  likes: number;
}

interface WeeklyLikesChartProps {
  data: DataPoint[];
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-elevated border border-highlight rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-neutral-400">Week of {label}</p>
      <p className="text-sm font-semibold text-linkify-green">
        {payload[0].value.toLocaleString()} likes
      </p>
    </div>
  );
}

export default function WeeklyLikesChart({ data, total }: WeeklyLikesChartProps) {
  return (
    <ChartCard
      title="Weekly Likes"
      value={total}
      hint="Total likes across all hit posts, summed per week."
      delay={0}
    >
      <div className="h-52">
        {data.length === 0 ? (
          <p className="text-neutral-500 text-sm pt-8 text-center">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="hitsLikesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1DB954" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1DB954" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 11 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="likes"
                stroke="#1DB954"
                strokeWidth={2}
                fill="url(#hitsLikesGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#1DB954', stroke: '#121212', strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
