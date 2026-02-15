import { runActor, type ActorRunResult } from '@/lib/apify/client';
import { mapPostToDatabase, type MappedPost } from '@/lib/apify/scrapers/post-scraper';

const ACTOR_ID = 'harvestapi/linkedin-post-search';

interface MentionSearchInput {
  searchQueries: string[];
  postedLimit?: string;
  sortBy?: string;
}

/** Raw output from harvestapi/linkedin-post-search — extends ApifyPostOutput with author metadata */
interface ApifySearchPostOutput {
  postId?: string;
  urn?: string;
  id?: string;
  shareUrn?: string;
  entityId?: string;
  url?: string;
  postUrl?: string;
  linkedinUrl?: string;
  text?: string;
  textContent?: string;
  content?: string;
  publishedAt?: string | number;
  postedAt?: string | number | { timestamp?: number; date?: string };
  date?: string | number;
  createdAt?: string | number;
  likes?: number;
  numLikes?: number;
  comments?: number | unknown[];
  numComments?: number;
  shares?: number;
  numShares?: number;
  reposts?: number;
  repostCount?: number;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  author?: {
    name?: string;
    publicIdentifier?: string;
    linkedinUrl?: string;
    avatar?: { url?: string };
    info?: string;
    type?: string;
  };
  type?: string;
  postType?: string;
  isRepost?: boolean;
  media?: unknown[];
  images?: string[];
  postImages?: unknown[];
  hashtags?: string[];
}

export interface MappedExternalPost extends MappedPost {
  authorName: string;
  authorLinkedinUrl: string;
  authorPublicIdentifier: string;
  authorAvatarUrl: string;
  authorHeadline: string;
}

export async function searchMentionPosts(
  companyName: string,
  companyUrl: string,
): Promise<{ runId: string; posts: MappedExternalPost[]; costUsd: number }> {
  const input: MentionSearchInput = {
    searchQueries: [companyName],
    postedLimit: 'month',
    sortBy: 'date',
  };

  const result: ActorRunResult<ApifySearchPostOutput> = await runActor(ACTOR_ID, input);

  const posts: MappedExternalPost[] = [];

  for (const item of result.items) {
    // Map using the shared post mapper (pass no profileUrl so authorship filter is skipped)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = mapPostToDatabase(item as any, companyUrl);
    if (!mapped) continue;

    // Force mentionsCompany to true — these posts were found via company name search
    mapped.mentionsCompany = true;

    const author = item.author ?? {};
    const authorLinkedinUrl = author.linkedinUrl
      ? author.linkedinUrl.replace(/\/+$/, '').split('?')[0]
      : author.publicIdentifier
        ? `https://www.linkedin.com/in/${author.publicIdentifier}`
        : '';

    posts.push({
      ...mapped,
      authorName: author.name ?? author.publicIdentifier ?? 'Unknown',
      authorLinkedinUrl,
      authorPublicIdentifier: author.publicIdentifier ?? '',
      authorAvatarUrl: author.avatar?.url ?? '',
      authorHeadline: author.info ?? '',
    });
  }

  return {
    runId: result.runId,
    posts,
    costUsd: result.costUsd,
  };
}
