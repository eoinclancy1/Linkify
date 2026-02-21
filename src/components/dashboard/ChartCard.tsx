'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface ChartCardProps {
  title: string;
  value: string | number;
  hint?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  children: React.ReactNode;
}

export default function ChartCard({ title, value, hint, trend, delay = 0, children }: ChartCardProps) {
  return (
    <div
      className="bg-surface rounded-lg p-6 relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(29,185,84,0.08)] hover:border-linkify-green/20 border border-transparent animate-chart-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Green left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-linkify-green/40 via-linkify-green/10 to-transparent" />
      {/* Glow blob */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-linkify-green/5 rounded-full blur-2xl" />

      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-sm text-neutral-400 flex items-center gap-1.5">
            {title}
            {hint && <InfoTooltip text={hint} />}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {trend && (
              <span className={`flex items-center gap-0.5 text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
