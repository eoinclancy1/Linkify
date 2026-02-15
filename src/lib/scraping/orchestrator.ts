import { prisma } from '@/lib/db/prisma';
import { discoverEmployees } from '@/lib/apify/scrapers/employee-discovery';
import { scrapeProfiles, extractCompanyStartDate, type MappedProfile } from '@/lib/apify/scrapers/profile-scraper';
import { scrapePostsForProfiles, type MappedPost } from '@/lib/apify/scrapers/post-scraper';
import { searchMentionPosts } from '@/lib/apify/scrapers/mention-search';
import type { ScrapeType, ScrapeStatus, Prisma } from '@prisma/client';

async function getConfig() {
  const config = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });
  return config ?? { companyLinkedinUrl: '', companyName: '', scrapeEnabled: true, scrapeHistoryDays: 30 };
}

async function createScrapeRun(type: ScrapeType) {
  return prisma.scrapeRun.create({
    data: { type, status: 'RUNNING' },
  });
}

async function completeScrapeRun(
  id: string,
  status: ScrapeStatus,
  stats: { itemsProcessed?: number; itemsCreated?: number; itemsUpdated?: number; costUsd?: number; errors?: unknown },
) {
  await prisma.scrapeRun.update({
    where: { id },
    data: {
      status,
      completedAt: new Date(),
      itemsProcessed: stats.itemsProcessed ?? 0,
      itemsCreated: stats.itemsCreated ?? 0,
      itemsUpdated: stats.itemsUpdated ?? 0,
      costUsd: stats.costUsd ?? 0,
      errors: stats.errors ? (stats.errors as object) : undefined,
    },
  });
}

export class ScrapeOrchestrator {
  async runFullSync(): Promise<void> {
    const config = await getConfig();
    if (!config.companyLinkedinUrl) {
      throw new Error('Company LinkedIn URL not configured');
    }

    await this.discoverNewEmployees();
    await this.scrapeAllProfiles();
    await this.scrapeAllPosts();
    await this.searchExternalMentions();
    await this.updateCompanyMentions();
    await this.refreshPostingActivities();
  }

  async discoverNewEmployees(): Promise<{ found: number; created: number }> {
    const config = await getConfig();
    if (!config.companyLinkedinUrl) throw new Error('Company LinkedIn URL not configured');

    const run = await createScrapeRun('EMPLOYEE_DISCOVERY');
    try {
      const result = await discoverEmployees(config.companyLinkedinUrl);

      let created = 0;
      for (const url of result.profileUrls) {
        const existing = await prisma.employee.findUnique({ where: { linkedinUrl: url } });
        if (!existing) {
          const slug = url.split('/in/')[1]?.replace(/\/$/, '') ?? 'unknown';
          await prisma.employee.create({
            data: {
              linkedinUrl: url,
              firstName: slug,
              lastName: '',
              fullName: slug,
              isActive: true,
            },
          });
          created++;
        }
      }

      await completeScrapeRun(run.id, 'COMPLETED', {
        itemsProcessed: result.profileUrls.length,
        itemsCreated: created,
        costUsd: result.costUsd,
      });

      return { found: result.profileUrls.length, created };
    } catch (error) {
      await completeScrapeRun(run.id, 'FAILED', {
        errors: { message: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  async scrapeAllProfiles(): Promise<{ updated: number }> {
    const config = await getConfig();
    const run = await createScrapeRun('PROFILE_SCRAPE');
    try {
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, linkedinUrl: true },
      });

      if (employees.length === 0) {
        await completeScrapeRun(run.id, 'COMPLETED', { itemsProcessed: 0 });
        return { updated: 0 };
      }

      const urls = employees.map((e) => e.linkedinUrl);
      const result = await scrapeProfiles(urls);

      let updated = 0;
      for (const profile of result.profiles) {
        const companyStartDate = extractCompanyStartDate(
          profile.experience,
          config.companyLinkedinUrl,
        );

        await prisma.employee.update({
          where: { linkedinUrl: profile.linkedinUrl },
          data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            headline: profile.headline,
            about: profile.about,
            jobTitle: profile.jobTitle,
            department: profile.department,
            avatarUrl: profile.avatarUrl,
            experience: (profile.experience as Prisma.InputJsonValue) ?? undefined,
            education: (profile.education as Prisma.InputJsonValue) ?? undefined,
            skills: (profile.skills as Prisma.InputJsonValue) ?? undefined,
            companyStartDate,
            lastScrapedAt: new Date(),
          },
        });
        updated++;
      }

      await completeScrapeRun(run.id, 'COMPLETED', {
        itemsProcessed: urls.length,
        itemsUpdated: updated,
        costUsd: result.costUsd,
      });

      return { updated };
    } catch (error) {
      await completeScrapeRun(run.id, 'FAILED', {
        errors: { message: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  async scrapeAllPosts(): Promise<{ created: number; updated: number }> {
    const config = await getConfig();
    const run = await createScrapeRun('POST_SCRAPE');

    try {
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, linkedinUrl: true },
      });

      if (employees.length === 0) {
        await completeScrapeRun(run.id, 'COMPLETED', { itemsProcessed: 0 });
        return { created: 0, updated: 0 };
      }

      const profiles = employees.map((e) => ({ profileUrl: e.linkedinUrl, authorId: e.id }));
      const result = await scrapePostsForProfiles(profiles, config.companyLinkedinUrl);

      let created = 0;
      let updated = 0;

      for (const [authorId, posts] of result.postsByAuthor) {
        for (const post of posts) {
          await upsertPost(authorId, post);
          // We count but can't easily distinguish create vs update from upsert
          created++;
        }
      }

      await completeScrapeRun(run.id, 'COMPLETED', {
        itemsProcessed: employees.length,
        itemsCreated: created,
        itemsUpdated: updated,
        costUsd: result.costUsd,
      });

      return { created, updated };
    } catch (error) {
      await completeScrapeRun(run.id, 'FAILED', {
        errors: { message: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  async searchExternalMentions(): Promise<{ created: number; updated: number }> {
    const config = await getConfig();

    // Derive company name from URL slug if not explicitly set
    const companyName = config.companyName
      || config.companyLinkedinUrl.match(/company\/([^/?]+)/)?.[1]?.replace(/-/g, ' ')
      || '';

    const run = await createScrapeRun('MENTION_SEARCH');
    try {
      if (!companyName) {
        throw new Error('Company name not configured — set a company LinkedIn URL in Settings');
      }

      const result = await searchMentionPosts(companyName, config.companyLinkedinUrl);

      let created = 0;
      let updated = 0;

      for (const post of result.posts) {
        // Check if the author is already a tracked employee
        let authorId: string | null = null;
        let isExternal = true;

        if (post.authorLinkedinUrl) {
          const existingEmployee = await prisma.employee.findUnique({
            where: { linkedinUrl: post.authorLinkedinUrl },
          });

          if (existingEmployee) {
            // Author is a known employee — treat as employee post
            authorId = existingEmployee.id;
            isExternal = existingEmployee.isExternalAuthor;
          }
        }

        // If no existing employee, create a lightweight external author record
        if (!authorId && post.authorLinkedinUrl) {
          const slug = post.authorPublicIdentifier || 'unknown';
          const nameParts = post.authorName.split(' ');
          const firstName = nameParts[0] ?? slug;
          const lastName = nameParts.slice(1).join(' ');

          const externalAuthor = await prisma.employee.create({
            data: {
              linkedinUrl: post.authorLinkedinUrl,
              firstName,
              lastName,
              fullName: post.authorName,
              headline: post.authorHeadline || null,
              jobTitle: post.authorHeadline || '',
              avatarUrl: post.authorAvatarUrl || '',
              isActive: true,
              isExternalAuthor: true,
            },
          });
          authorId = externalAuthor.id;
          isExternal = true;
        }

        if (!authorId) continue; // Skip posts with no identifiable author

        // Upsert the post
        const existing = await prisma.post.findUnique({
          where: { linkedinPostId: post.linkedinPostId },
        });

        if (existing) {
          await prisma.post.update({
            where: { linkedinPostId: post.linkedinPostId },
            data: {
              textContent: post.textContent,
              publishedAt: post.publishedAt,
              linkedinUrl: post.linkedinUrl,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              engagementScore: post.engagementScore,
              mentionsCompany: true,
              isExternal,
              mediaUrls: post.mediaUrls ?? undefined,
              hashtags: post.hashtags ?? undefined,
            },
          });
          updated++;
        } else {
          await prisma.post.create({
            data: {
              linkedinPostId: post.linkedinPostId,
              linkedinUrl: post.linkedinUrl,
              authorId,
              type: post.type,
              textContent: post.textContent,
              publishedAt: post.publishedAt,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              engagementScore: post.engagementScore,
              mentionsCompany: true,
              isExternal,
              mediaUrls: post.mediaUrls ?? undefined,
              hashtags: post.hashtags ?? undefined,
            },
          });
          created++;
        }
      }

      await completeScrapeRun(run.id, 'COMPLETED', {
        itemsProcessed: result.posts.length,
        itemsCreated: created,
        itemsUpdated: updated,
        costUsd: result.costUsd,
      });

      return { created, updated };
    } catch (error) {
      await completeScrapeRun(run.id, 'FAILED', {
        errors: { message: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  async updateCompanyMentions(): Promise<void> {
    // Clear existing mentions and rebuild from posts
    await prisma.companyMention.deleteMany();

    const posts = await prisma.post.findMany({
      where: { mentionsCompany: true },
      select: { id: true, authorId: true, publishedAt: true },
    });

    for (const post of posts) {
      await prisma.companyMention.create({
        data: {
          postId: post.id,
          authorId: post.authorId,
          publishedAt: post.publishedAt,
        },
      });
    }
  }

  async refreshPostingActivities(): Promise<void> {
    const posts = await prisma.post.findMany({
      select: { authorId: true, publishedAt: true },
    });

    // Group by employee + date
    const activityMap = new Map<string, number>();
    for (const post of posts) {
      const dateStr = post.publishedAt.toISOString().slice(0, 10);
      const key = `${post.authorId}:${dateStr}`;
      activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
    }

    for (const [key, count] of activityMap) {
      const [employeeId, dateStr] = key.split(':');
      const date = new Date(dateStr);

      await prisma.postingActivity.upsert({
        where: { employeeId_date: { employeeId, date } },
        create: { employeeId, date, postCount: count },
        update: { postCount: count },
      });
    }
  }
}

async function upsertPost(authorId: string, post: MappedPost): Promise<void> {
  const existing = await prisma.post.findUnique({
    where: { linkedinPostId: post.linkedinPostId },
  });

  if (existing) {
    // Create engagement snapshot if metrics changed
    if (
      existing.likes !== post.likes ||
      existing.comments !== post.comments ||
      existing.shares !== post.shares
    ) {
      await prisma.engagementSnapshot.create({
        data: {
          postId: existing.id,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          score: post.engagementScore,
        },
      });
    }

    await prisma.post.update({
      where: { linkedinPostId: post.linkedinPostId },
      data: {
        textContent: post.textContent,
        publishedAt: post.publishedAt,
        linkedinUrl: post.linkedinUrl,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        engagementScore: post.engagementScore,
        mentionsCompany: post.mentionsCompany,
        mediaUrls: post.mediaUrls ?? undefined,
        hashtags: post.hashtags ?? undefined,
      },
    });
  } else {
    await prisma.post.create({
      data: {
        linkedinPostId: post.linkedinPostId,
        linkedinUrl: post.linkedinUrl,
        authorId,
        type: post.type,
        textContent: post.textContent,
        publishedAt: post.publishedAt,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        engagementScore: post.engagementScore,
        mentionsCompany: post.mentionsCompany,
        mediaUrls: post.mediaUrls ?? undefined,
        hashtags: post.hashtags ?? undefined,
      },
    });
  }
}
