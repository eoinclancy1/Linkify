import useSWR from 'swr';
import type { PostingStreak } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStreaks() {
  const { data, error, isLoading } = useSWR<PostingStreak[]>('/api/streaks', fetcher);

  return {
    streaks: data,
    isLoading,
    error,
  };
}

export function useStreak(employeeId: string | undefined) {
  const { data, error, isLoading } = useSWR<PostingStreak>(
    employeeId ? `/api/streaks?employeeId=${employeeId}` : null,
    fetcher,
  );

  return {
    streak: data,
    isLoading,
    error,
  };
}
