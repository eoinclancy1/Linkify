'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, hint, trend }: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg p-6 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-linkify-green/5 rounded-full blur-2xl" />
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-linkify-green/40 via-linkify-green/10 to-transparent" />
      <div className="absolute top-4 right-4 bg-linkify-green/15 text-linkify-green rounded-full p-2.5">
        <Icon className="w-5 h-5" />
      </div>

      <div className="pr-12">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-neutral-400 mt-1 text-sm flex items-center gap-1.5">
          {title}
          {hint && <InfoTooltip text={hint} />}
        </p>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
