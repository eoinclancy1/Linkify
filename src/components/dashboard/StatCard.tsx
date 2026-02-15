'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg p-6 relative">
      <div className="absolute top-4 right-4 bg-linkify-green/10 text-linkify-green rounded-full p-2">
        <Icon className="w-5 h-5" />
      </div>

      <div className="pr-12">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-neutral-400 mt-1 text-sm">{title}</p>
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
