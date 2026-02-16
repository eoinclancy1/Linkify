import type { Employee, Post, PostingStreak, PostingActivity, CompanyMention } from '@/types';
import type { DataProvider, DashboardStats } from '@/lib/data/provider';

/**
 * LinkedIn API data provider stub.
 * TODO: Implement when LinkedIn API access is configured.
 */
export class LinkedInDataProvider implements DataProvider {
  // TODO: Add LinkedIn API client configuration (OAuth tokens, org ID, etc.)

  async getEmployees(): Promise<Employee[]> {
    // TODO: Fetch employees from LinkedIn Organization API
    throw new Error('LinkedInDataProvider.getEmployees() is not yet implemented');
  }

  async getAdvisors(): Promise<Employee[]> {
    // TODO: Fetch advisors from LinkedIn API
    throw new Error('LinkedInDataProvider.getAdvisors() is not yet implemented');
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    // TODO: Fetch a single employee profile from LinkedIn
    throw new Error('LinkedInDataProvider.getEmployeeById() is not yet implemented');
  }

  async getPostsByEmployee(employeeId: string, days?: number): Promise<Post[]> {
    // TODO: Fetch posts authored by a specific employee via LinkedIn UGC API
    throw new Error('LinkedInDataProvider.getPostsByEmployee() is not yet implemented');
  }

  async getAllPosts(days?: number): Promise<Post[]> {
    // TODO: Fetch all organization-related posts via LinkedIn API
    throw new Error('LinkedInDataProvider.getAllPosts() is not yet implemented');
  }

  async getCompanyMentions(days?: number, sort?: string): Promise<CompanyMention[]> {
    // TODO: Fetch posts that mention the company via LinkedIn API
    throw new Error('LinkedInDataProvider.getCompanyMentions() is not yet implemented');
  }

  async getStreak(employeeId: string): Promise<PostingStreak> {
    // TODO: Compute streak from LinkedIn posting history
    throw new Error('LinkedInDataProvider.getStreak() is not yet implemented');
  }

  async getAllStreaks(): Promise<PostingStreak[]> {
    // TODO: Compute streaks for all employees
    throw new Error('LinkedInDataProvider.getAllStreaks() is not yet implemented');
  }

  async getPostingActivity(employeeId: string): Promise<PostingActivity[]> {
    // TODO: Derive posting activity from LinkedIn API data
    throw new Error('LinkedInDataProvider.getPostingActivity() is not yet implemented');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // TODO: Aggregate dashboard statistics from LinkedIn API
    throw new Error('LinkedInDataProvider.getDashboardStats() is not yet implemented');
  }
}
