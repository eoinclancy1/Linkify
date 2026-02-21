'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';

interface DataPoint {
  week: string;
  employee: number;
  external: number;
}

interface WeeklyPostsChartProps {
  data: DataPoint[];
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-elevated border border-highlight rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-neutral-400 mb-1">Week of {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.value}</span>{' '}
          <span className="text-neutral-400">{entry.name}</span>
        </p>
      ))}
    </div>
  );
}

export default function WeeklyPostsChart({ data, total }: WeeklyPostsChartProps) {
  return (
    <ChartCard
      title="Weekly Hit Posts"
      value={total}
      hint="Number of posts with 100+ reactions per week, split by employee vs external author."
      delay={150}
    >
      <div className="h-52">
        {data.length === 0 ? (
          <p className="text-neutral-500 text-sm pt-8 text-center">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
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
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="employee"
                name="Employee"
                stackId="a"
                fill="#1DB954"
                radius={[0, 0, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="external"
                name="External"
                stackId="a"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
