'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DataPoint {
  date: string;
  engagement: number;
}

interface EngagementChartProps {
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

export default function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div className="bg-surface rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Engagement (30 days)</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1DB954" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#1DB954" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 12 }}
              dx={-8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="#1DB954"
              strokeWidth={2}
              fill="url(#engagementGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#1DB954',
                stroke: '#121212',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
