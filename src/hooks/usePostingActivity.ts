import useSWR from 'swr';
import type { PostingActivity } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePostingActivity(employeeId: string | undefined) {
  const { data, error, isLoading } = useSWR<PostingActivity[]>(
    employeeId ? `/api/activity?employeeId=${employeeId}` : null,
    fetcher,
  );

  return {
    activities: data,
    isLoading,
    error,
  };
}
