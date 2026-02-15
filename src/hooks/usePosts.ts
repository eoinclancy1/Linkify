import useSWR from 'swr';
import type { Post } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePosts(employeeId?: string, days?: number) {
  const params = new URLSearchParams();
  if (employeeId) params.set('employeeId', employeeId);
  if (days) params.set('range', String(days));

  const query = params.toString();
  const url = query ? `/api/posts?${query}` : '/api/posts';

  const { data, error, isLoading } = useSWR<Post[]>(url, fetcher);

  return {
    posts: data,
    isLoading,
    error,
  };
}
