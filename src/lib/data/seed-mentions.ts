import type { CompanyMention } from '@/types';
import { seedPosts } from '@/lib/data/seed-posts';
import { seedEmployees } from '@/lib/data/seed-employees';

const employeeMap = new Map(seedEmployees.map((e) => [e.id, e]));

/**
 * Derive company mentions from posts where mentionsCompany is true.
 * Sorted by engagement score descending, with rank assigned starting at 1.
 */
export const seedMentions: CompanyMention[] = seedPosts
  .filter((post) => post.mentionsCompany)
  .sort((a, b) => b.engagement.engagementScore - a.engagement.engagementScore)
  .map((post, index) => {
    const author = employeeMap.get(post.authorId)!;
    return {
      id: `mention-${String(index + 1).padStart(4, '0')}`,
      postId: post.id,
      post,
      author,
      rank: index + 1,
    };
  });
