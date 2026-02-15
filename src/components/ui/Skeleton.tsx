type SkeletonVariant = 'text' | 'avatar' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  avatar: 'h-12 w-12 rounded-full',
  card: 'h-32 w-full rounded-lg',
};

export default function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-elevated ${variantStyles[variant]} ${className}`}
    />
  );
}
