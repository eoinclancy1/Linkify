'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

interface DataPoint {
  date: string;
  engagement: number;
}

interface EngagementTrendChartProps {
  data: DataPoint[];
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
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-sm font-semibold text-linkify-green">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function EngagementTrendChart({ data }: EngagementTrendChartProps) {
  const total = data.reduce((sum, d) => sum + d.engagement, 0);

  // Week-over-week change
  const thisWeek = data.slice(-7).reduce((s, d) => s + d.engagement, 0);
  const lastWeek = data.slice(-14, -7).reduce((s, d) => s + d.engagement, 0);
  const wowChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  return (
    <ChartCard
      title="Engagement Trend"
      value={total}
      trend={wowChange !== 0 ? { value: Math.abs(wowChange), isPositive: wowChange > 0 } : undefined}
      delay={0}
    >
      <div className="h-48">
        {data.length === 0 ? (
          <p className="text-neutral-500 text-sm pt-8 text-center">No engagement data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1DB954" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1DB954" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval={6}
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
                dataKey="engagement"
                stroke="#1DB954"
                strokeWidth={2}
                fill="url(#engGradient)"
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
