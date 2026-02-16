import type { Employee, Post, PostingStreak, PostingActivity, CompanyMention } from '@/types';
import { MockDataProvider } from './mock-provider';
import { PostgresDataProvider } from './postgres-provider';

export interface DashboardStats {
  totalPosts30d: number;
  totalMentions30d: number;
  avgEngagementScore: number;
  activeStreaks: number;
}

export interface DataProvider {
  getEmployees(): Promise<Employee[]>;
  getAdvisors(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | null>;
  getPostsByEmployee(employeeId: string, days?: number): Promise<Post[]>;
  getAllPosts(days?: number): Promise<Post[]>;
  getCompanyMentions(days?: number, sort?: string): Promise<CompanyMention[]>;
  getStreak(employeeId: string): Promise<PostingStreak>;
  getAllStreaks(): Promise<PostingStreak[]>;
  getPostingActivity(employeeId: string): Promise<PostingActivity[]>;
  getDashboardStats(): Promise<DashboardStats>;
}

export function createDataProvider(): DataProvider {
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL) {
    return new MockDataProvider();
  }
  return new PostgresDataProvider();
}

let _provider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!_provider) {
    _provider = createDataProvider();
  }
  return _provider;
}
