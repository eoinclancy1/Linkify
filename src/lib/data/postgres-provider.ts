import type { Employee, Post, PostingStreak, PostingActivity, CompanyMention, PostType } from '@/types';
import type { DataProvider, DashboardStats } from '@/lib/data/provider';
import type { Employee as PrismaEmployee, Post as PrismaPost, Department } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { computeStreaks } from '@/lib/utils/streaks';

// ─── Mapping helpers ─────────────────────────────────────────────────────────

const DEPARTMENT_MAP: Record<Department, Employee['department']> = {
  ENGINEERING: 'Engineering',
  MARKETING: 'Marketing',
  SALES: 'Sales',
  PRODUCT: 'Product',
  DESIGN: 'Design',
  LEADERSHIP: 'Leadership',
  OPERATIONS: 'Operations',
  PEOPLE: 'People',
  PARTNERSHIPS: 'Partnerships',
  DATA: 'Data',
  CONTENT_ENGINEERING: 'Content Engineering',
  OTHER: 'Other',
};

const POST_TYPE_MAP: Record<string, PostType> = {
  ORIGINAL: 'original',
  RESHARE: 'reshare',
  ARTICLE: 'article',
  POLL: 'poll',
};

function mapEmployee(e: PrismaEmployee): Employee {
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    fullName: e.fullName,
    jobTitle: e.jobTitle,
    department: DEPARTMENT_MAP[e.department] ?? 'Other',
    linkedinProfileUrl: e.linkedinUrl,
    avatarUrl: e.avatarUrl,
    isActive: e.isActive,
  };
}

function mapPost(p: PrismaPost): Post {
  return {
    id: p.id,
    authorId: p.authorId,
    type: (POST_TYPE_MAP[p.type] ?? 'original') as PostType,
    textContent: p.textContent,
    publishedAt: p.publishedAt.toISOString(),
    url: p.linkedinUrl,
    engagement: {
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      engagementScore: p.engagementScore,
    },
    mentionsCompany: p.mentionsCompany,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export class PostgresDataProvider implements DataProvider {
  async getEmployees(): Promise<Employee[]> {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    });
    return employees.map(mapEmployee);
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    const employee = await prisma.employee.findUnique({ where: { id } });
    return employee ? mapEmployee(employee) : null;
  }

  async getAllPosts(days?: number): Promise<Post[]> {
    const where = days !== undefined
      ? { publishedAt: { gte: daysAgo(days) } }
      : {};

    const posts = await prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
    return posts.map(mapPost);
  }

  async getPostsByEmployee(employeeId: string, days?: number): Promise<Post[]> {
    const where: Record<string, unknown> = { authorId: employeeId };
    if (days !== undefined) {
      where.publishedAt = { gte: daysAgo(days) };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
    return posts.map(mapPost);
  }

  async getCompanyMentions(days?: number, sort?: string): Promise<CompanyMention[]> {
    const dateFilter = days !== undefined
      ? { publishedAt: { gte: daysAgo(days) } }
      : {};

    const orderBy = sort === 'date'
      ? { publishedAt: 'desc' as const }
      : { post: { engagementScore: 'desc' as const } };

    const mentions = await prisma.companyMention.findMany({
      where: dateFilter,
      include: {
        post: true,
        author: true,
      },
      orderBy,
    });

    return mentions.map((m, i) => ({
      id: m.id,
      postId: m.postId,
      post: mapPost(m.post),
      author: mapEmployee(m.author),
      rank: i + 1,
    }));
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
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const streaks: PostingStreak[] = [];
    for (const emp of employees) {
      const streak = await this.getStreak(emp.id);
      streaks.push(streak);
    }
    return streaks;
  }

  async getPostingActivity(employeeId: string): Promise<PostingActivity[]> {
    const activities = await prisma.postingActivity.findMany({
      where: { employeeId },
      orderBy: { date: 'asc' },
    });

    return activities.map((a) => ({
      employeeId: a.employeeId,
      date: a.date.toISOString().slice(0, 10),
      postCount: a.postCount,
    }));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = daysAgo(30);

    const [postCount, mentionCount, avgScore, allStreaks] = await Promise.all([
      prisma.post.count({
        where: { publishedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.companyMention.count({
        where: { publishedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.post.aggregate({
        where: { publishedAt: { gte: thirtyDaysAgo } },
        _avg: { engagementScore: true },
      }),
      this.getAllStreaks(),
    ]);

    return {
      totalPosts30d: postCount,
      totalMentions30d: mentionCount,
      avgEngagementScore: Math.round(avgScore._avg.engagementScore ?? 0),
      activeStreaks: allStreaks.filter((s) => s.isActive).length,
    };
  }
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
