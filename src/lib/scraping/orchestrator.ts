import { prisma } from '@/lib/db/prisma';
import { discoverEmployees } from '@/lib/apify/scrapers/employee-discovery';
import { scrapeProfiles, extractCompanyStartDate, inferRole } from '@/lib/apify/scrapers/profile-scraper';
import { scrapePostsForProfiles, detectCompanyMention, type MappedPost } from '@/lib/apify/scrapers/post-scraper';
import { searchMentionPosts } from '@/lib/apify/scrapers/mention-search';
import type { ScrapeType, ScrapeStatus, Prisma } from '@prisma/client';

/** Extract the /in/username slug from a LinkedIn profile URL for fuzzy matching */
function extractLinkedinSlug(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

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
  /**
   * Full sync — discovery + profiles + posts + mentions + derived tables.
   * Intended for weekly runs or manual "Full Sync" triggers.
   */
  async runFullSync(): Promise<void> {
    const config = await getConfig();
    if (!config.companyLinkedinUrl) {
      throw new Error('Company LinkedIn URL not configured');
    }

    await this.expireStuckRuns();
    await this.discoverNewEmployees();
    await this.scrapeAllProfiles();
    const scrapeStart = new Date();
    await this.scrapeAllPosts();
    await this.searchExternalMentions();
    await this.updateCompanyMentions();
    await this.refreshPostingActivities(scrapeStart);
  }

  /**
   * Daily light sync — posts + mentions + derived tables.
   * Skips discovery and profile scraping (those change infrequently).
   */
  async runDailySync(): Promise<void> {
    const config = await getConfig();
    if (!config.companyLinkedinUrl) {
      throw new Error('Company LinkedIn URL not configured');
    }

    await this.expireStuckRuns();
    const scrapeStart = new Date();
    await this.scrapeAllPosts();
    await this.searchExternalMentions();
    await this.updateCompanyMentions();
    await this.refreshPostingActivities(scrapeStart);
  }

  /**
   * Weekly full sync — includes discovery and profile updates.
   */
  async runWeeklySync(): Promise<void> {
    await this.runFullSync();
  }

  /**
   * Auto-expire scrape runs stuck in RUNNING status for more than 30 minutes.
   */
  async expireStuckRuns(): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const stuckRuns = await prisma.scrapeRun.findMany({
      where: {
        status: 'RUNNING',
        startedAt: { lt: thirtyMinutesAgo },
      },
    });

    for (const run of stuckRuns) {
      await prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: { message: 'Auto-expired: stuck in RUNNING for over 30 minutes' } as object,
        },
      });
    }

    if (stuckRuns.length > 0) {
      console.log(`[orchestrator] Expired ${stuckRuns.length} stuck scrape run(s)`);
    }

    return stuckRuns.length;
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
        select: { id: true, linkedinUrl: true, isManuallyAdded: true },
      });

      if (employees.length === 0) {
        await completeScrapeRun(run.id, 'COMPLETED', { itemsProcessed: 0 });
        return { updated: 0 };
      }

      const urls = employees.map((e) => e.linkedinUrl);
      const result = await scrapeProfiles(urls);

      let updated = 0;
      for (const profile of result.profiles) {
        // Look up employee first — the scraper may return a URL that doesn't
        // exactly match (trailing slash, redirects, etc.)
        const employee = await prisma.employee.findUnique({
          where: { linkedinUrl: profile.linkedinUrl },
        });
        if (!employee) {
          console.warn(`[profile-scrape] No employee found for URL: ${profile.linkedinUrl}, skipping`);
          continue;
        }

        const companyStartDate = extractCompanyStartDate(
          profile.experience,
          config.companyLinkedinUrl,
        );

        // Auto-infer role from headline for discovered employees (not manually added)
        const roleUpdate = !employee.isManuallyAdded
          ? { role: inferRole(profile.headline) as 'EMPLOYEE' | 'ADVISOR' }
          : {};

        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            headline: profile.headline,
            about: profile.about,
            jobTitle: profile.jobTitle,
            department: profile.department,
            ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
            experience: (profile.experience as Prisma.InputJsonValue) ?? undefined,
            education: (profile.education as Prisma.InputJsonValue) ?? undefined,
            skills: (profile.skills as Prisma.InputJsonValue) ?? undefined,
            companyStartDate,
            lastScrapedAt: new Date(),
            ...roleUpdate,
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
      const result = await scrapePostsForProfiles(profiles, config.companyLinkedinUrl, config.companyName);

      let created = 0;
      let updated = 0;

      for (const [authorId, posts] of result.postsByAuthor) {
        for (const post of posts) {
          const action = await upsertPost(authorId, post);
          if (action === 'created') created++;
          else updated++;
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

      // Pre-load all employee LinkedIn URL slugs for fuzzy matching
      const allEmployees = await prisma.employee.findMany({
        select: { id: true, linkedinUrl: true },
      });
      const employeeBySlug = new Map<string, string>();
      for (const emp of allEmployees) {
        const slug = extractLinkedinSlug(emp.linkedinUrl);
        if (slug) employeeBySlug.set(slug, emp.id);
      }

      for (const post of result.posts) {
        // Check if the author is a known employee/advisor by LinkedIn URL slug
        let authorId: string | null = null;
        let isExternal = true;

        if (post.authorLinkedinUrl) {
          const slug = extractLinkedinSlug(post.authorLinkedinUrl);
          const matchedId = slug ? employeeBySlug.get(slug) : undefined;

          if (matchedId) {
            authorId = matchedId;
            isExternal = false;
          }
        }

        // Build inline external author fields for unknown authors
        const externalFields = isExternal ? {
          externalAuthorName: post.authorName || null,
          externalAuthorUrl: post.authorLinkedinUrl || null,
          externalAuthorAvatarUrl: post.authorAvatarUrl || null,
          externalAuthorHeadline: post.authorHeadline || null,
        } : {
          externalAuthorName: null,
          externalAuthorUrl: null,
          externalAuthorAvatarUrl: null,
          externalAuthorHeadline: null,
        };

        // Upsert the post
        const existing = await prisma.post.findUnique({
          where: { linkedinPostId: post.linkedinPostId },
        });

        if (existing) {
          // If the post already has an authorId (from post scraper), preserve it
          // — don't let a mention search URL mismatch overwrite a known author
          const preserveAuthor = existing.authorId && !authorId;
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
              ...(preserveAuthor ? {} : { isExternal, authorId, ...externalFields }),
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
              ...externalFields,
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
    // Re-evaluate mentionsCompany for posts that may have been missed
    // (e.g. employee posts mentioning "AirOps" by name, not the URL slug "airopshq")
    const config = await getConfig();
    if (config.companyName && config.companyLinkedinUrl) {
      const unchecked = await prisma.post.findMany({
        where: { mentionsCompany: false, authorId: { not: null } },
        select: { id: true, textContent: true },
      });

      let repaired = 0;
      for (const p of unchecked) {
        if (detectCompanyMention(p.textContent, config.companyLinkedinUrl, config.companyName)) {
          await prisma.post.update({
            where: { id: p.id },
            data: { mentionsCompany: true },
          });
          repaired++;
        }
      }
      if (repaired > 0) {
        console.log(`[orchestrator] Repaired mentionsCompany on ${repaired} employee post(s)`);
      }
    }

    // Upsert mentions for posts flagged mentionsCompany (incremental)
    const posts = await prisma.post.findMany({
      where: { mentionsCompany: true },
      select: { id: true, authorId: true, publishedAt: true },
    });

    const mentionPostIds = new Set<string>();
    for (const post of posts) {
      mentionPostIds.add(post.id);
      await prisma.companyMention.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          authorId: post.authorId,
          publishedAt: post.publishedAt,
        },
        update: {
          authorId: post.authorId,
          publishedAt: post.publishedAt,
        },
      });
    }

    // Remove mentions for posts that no longer have mentionsCompany
    await prisma.companyMention.deleteMany({
      where: { postId: { notIn: [...mentionPostIds] } },
    });
  }

  /**
   * Refresh posting activity counts. If `since` is provided, only recompute
   * for authors who have posts updated after that date (incremental).
   * Falls back to a full rebuild if `since` is not given.
   */
  async refreshPostingActivities(since?: Date): Promise<void> {
    // Find which authors need recalculation
    let authorIds: string[] | undefined;
    if (since) {
      const recentPosts = await prisma.post.findMany({
        where: { authorId: { not: null }, updatedAt: { gte: since } },
        select: { authorId: true },
        distinct: ['authorId'],
      });
      authorIds = recentPosts.map((p) => p.authorId!);
      if (authorIds.length === 0) return; // nothing changed
    }

    // Fetch posts for the affected authors (or all if full rebuild)
    const posts = await prisma.post.findMany({
      where: {
        authorId: { not: null, ...(authorIds ? { in: authorIds } : {}) },
      },
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

/** Returns 'created' or 'updated' so the caller can count accurately. */
async function upsertPost(authorId: string, post: MappedPost): Promise<'created' | 'updated'> {
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
        authorId,
        isExternal: false,
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
    return 'updated';
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
    return 'created';
  }
}
