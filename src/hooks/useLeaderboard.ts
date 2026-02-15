import useSWR from 'swr';
import type { CompanyMention } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeaderboard(
  timeRange: 7 | 14 | 30,
  sort: 'engagement' | 'likes' | 'comments' | 'shares' | 'recent',
) {
  const { data, error, isLoading } = useSWR<CompanyMention[]>(
    `/api/mentions?range=${timeRange}&sort=${sort}`,
    fetcher,
  );

  return {
    mentions: data,
    isLoading,
    error,
  };
}
