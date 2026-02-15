import Skeleton from '@/components/ui/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" className="w-64 h-8" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="text" className="w-20 h-8 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
      </div>
    </div>
  );
}
