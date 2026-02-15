import Skeleton from '@/components/ui/Skeleton';

export default function EmployeesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" className="w-48 h-8" />
      <Skeleton variant="text" className="w-full h-12 rounded-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="card" className="h-48" />
        ))}
      </div>
    </div>
  );
}
