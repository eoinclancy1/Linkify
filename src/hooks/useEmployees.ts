import useSWR from 'swr';
import type { Employee } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useEmployees() {
  const { data, error, isLoading } = useSWR<Employee[]>('/api/employees', fetcher);

  return {
    employees: data,
    isLoading,
    error,
  };
}

export function useEmployee(id: string | undefined) {
  const { data, error, isLoading } = useSWR<Employee>(
    id ? `/api/employees?id=${id}` : null,
    fetcher,
  );

  return {
    employee: data,
    isLoading,
    error,
  };
}
