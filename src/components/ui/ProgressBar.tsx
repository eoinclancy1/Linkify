interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export default function ProgressBar({ value, color, className = '' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-highlight rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color ?? 'bg-linkify-green'}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
