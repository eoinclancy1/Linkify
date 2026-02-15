import useSWR from 'swr';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPosts: number;
  postsThisWeek: number;
  avgEngagement: number;
  totalMentions: number;
  activeStreaks: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>('/api/stats', fetcher);

  return {
    stats: data,
    isLoading,
    error,
  };
}
