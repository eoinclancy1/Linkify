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
    const author = post.authorId ? employeeMap.get(post.authorId) ?? null : null;
    const authorName = author?.fullName ?? post.externalAuthorName ?? 'Unknown';
    const authorAvatarUrl = author?.avatarUrl ?? post.externalAuthorAvatarUrl ?? '';
    return {
      id: `mention-${String(index + 1).padStart(4, '0')}`,
      postId: post.id,
      post,
      author,
      authorName,
      authorAvatarUrl,
      rank: index + 1,
    };
  });
