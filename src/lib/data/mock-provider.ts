import type { Employee, Post, PostingStreak, PostingActivity, CompanyMention } from '@/types';
import type { DataProvider, DashboardStats } from '@/lib/data/provider';
import { seedEmployees, seedAdvisors } from '@/lib/data/seed-employees';
import { seedPosts } from '@/lib/data/seed-posts';
import { seedMentions } from '@/lib/data/seed-mentions';
import { isWithinDays } from '@/lib/utils/date';
import { computeStreaks } from '@/lib/utils/streaks';

export class MockDataProvider implements DataProvider {
  private employees: Employee[] = seedEmployees;
  private advisors: Employee[] = seedAdvisors;
  private posts: Post[] = seedPosts;
  private mentions: CompanyMention[] = seedMentions;

  async getEmployees(): Promise<Employee[]> {
    return this.employees;
  }

  async getAdvisors(): Promise<Employee[]> {
    return this.advisors;
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employees.find((e) => e.id === id)
      ?? this.advisors.find((e) => e.id === id)
      ?? null;
  }

  async getPostsByEmployee(employeeId: string, days?: number): Promise<Post[]> {
    let posts = this.posts.filter((p) => p.authorId === employeeId);
    if (days !== undefined) {
      posts = posts.filter((p) => isWithinDays(p.publishedAt, days));
    }
    return posts;
  }

  async getAllPosts(days?: number): Promise<Post[]> {
    if (days === undefined) return this.posts;
    return this.posts.filter((p) => isWithinDays(p.publishedAt, days));
  }

  async getCompanyMentions(days?: number, sort?: string): Promise<CompanyMention[]> {
    let mentions = this.mentions;

    if (days !== undefined) {
      mentions = mentions.filter((m) => isWithinDays(m.post.publishedAt, days));
    }

    if (sort === 'date') {
      mentions = [...mentions].sort(
        (a, b) => new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime()
      );
      // Re-assign ranks after sorting
      mentions = mentions.map((m, i) => ({ ...m, rank: i + 1 }));
    } else {
      // Default sort: by engagement score descending (already sorted in seed data)
      // Re-assign ranks after date filtering
      mentions = mentions.map((m, i) => ({ ...m, rank: i + 1 }));
    }

    return mentions;
  }

  async getStreak(employeeId: string): Promise<PostingStreak> {
    const activities = await this.getPostingActivity(employeeId);
    const result = computeStreaks(activities);

    return {
      employeeId,
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      streakUnit: 'week',
      lastPostDate: result.lastPostDate,
      isActive: result.isActive,
    };
  }

  async getAllStreaks(): Promise<PostingStreak[]> {
    const allTracked = [...this.employees, ...this.advisors];
    const streaks: PostingStreak[] = [];
    for (const employee of allTracked) {
      const streak = await this.getStreak(employee.id);
      streaks.push(streak);
    }
    return streaks;
  }

  async getPostingActivity(employeeId: string): Promise<PostingActivity[]> {
    const employeePosts = this.posts.filter((p) => p.authorId === employeeId);

    // Group posts by date (YYYY-MM-DD)
    const dateMap = new Map<string, number>();
    for (const post of employeePosts) {
      const date = post.publishedAt.slice(0, 10);
      dateMap.set(date, (dateMap.get(date) ?? 0) + 1);
    }

    // Convert to PostingActivity array, sorted by date
    return Array.from(dateMap.entries())
      .map(([date, postCount]) => ({
        employeeId,
        date,
        postCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const posts30d = this.posts.filter((p) => isWithinDays(p.publishedAt, 30));
    const mentions30d = this.mentions.filter((m) => isWithinDays(m.post.publishedAt, 30));

    const totalEngagement = posts30d.reduce(
      (sum, p) => sum + p.engagement.engagementScore,
      0
    );
    const avgEngagementScore = posts30d.length > 0
      ? Math.round(totalEngagement / posts30d.length)
      : 0;

    const allStreaks = await this.getAllStreaks();
    const activeStreaks = allStreaks.filter((s) => s.isActive).length;

    return {
      totalPosts30d: posts30d.length,
      totalMentions30d: mentions30d.length,
      avgEngagementScore,
      activeStreaks,
    };
  }
}
