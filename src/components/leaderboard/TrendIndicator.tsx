import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  isPositive: boolean;
}

export default function TrendIndicator({ value, isPositive }: TrendIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-green-500' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-4 h-4" />
      ) : (
        <TrendingDown className="w-4 h-4" />
      )}
      {isPositive ? '+' : ''}
      {value}%
    </span>
  );
}
