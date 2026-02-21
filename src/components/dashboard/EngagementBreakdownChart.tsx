'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartCard from './ChartCard';

interface BreakdownData {
  name: string;
  value: number;
  color: string;
}

interface EngagementBreakdownChartProps {
  data: BreakdownData[];
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BreakdownData; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-elevated border border-highlight rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold" style={{ color: item.payload.color }}>
        {item.value.toLocaleString()}
      </p>
      <p className="text-xs text-neutral-400">{item.payload.name}</p>
    </div>
  );
}

export default function EngagementBreakdownChart({ data, total }: EngagementBreakdownChartProps) {
  return (
    <ChartCard title="Engagement Breakdown" value={total} delay={300}>
      <div className="h-48">
        {total === 0 ? (
          <p className="text-neutral-500 text-sm pt-8 text-center">No engagement data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 4, bottom: 0, left: 8 }}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={300}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
