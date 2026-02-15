import { runActor, sleep, type ActorRunResult } from '@/lib/apify/client';
import { calculateEngagementScore } from '@/lib/utils/engagement';
import type { PostType } from '@prisma/client';

const ACTOR_ID = 'harvestapi/linkedin-profile-posts';
const PROFILE_DELAY_MS = 5_000;

interface PostScraperInput {
  targetUrls: string[];
}

interface ApifyPostOutput {
  postId?: string;
  urn?: string;
  id?: string;
  url?: string;
  postUrl?: string;
  text?: string;
  textContent?: string;
  content?: string;
  publishedAt?: string;
  postedAt?: string;
  date?: string;
  createdAt?: string;
  likes?: number;
  numLikes?: number;
  comments?: number;
  numComments?: number;
  shares?: number;
  numShares?: number;
  reposts?: number;
  type?: string;
  postType?: string;
  media?: unknown[];
  images?: string[];
  hashtags?: string[];
}

export interface MappedPost {
  linkedinPostId: string;
  linkedinUrl: string;
  type: PostType;
  textContent: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  engagementScore: number;
  mentionsCompany: boolean;
  mediaUrls: string[] | null;
  hashtags: string[] | null;
}

function mapPostType(raw?: string): PostType {
  if (!raw) return 'ORIGINAL';
  const lower = raw.toLowerCase();
  if (lower.includes('reshare') || lower.includes('repost')) return 'RESHARE';
  if (lower.includes('article')) return 'ARTICLE';
  if (lower.includes('poll')) return 'POLL';
  return 'ORIGINAL';
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : [];
}

export function detectCompanyMention(text: string, companyUrl: string): boolean {
  if (!text || !companyUrl) return false;

  // Extract company slug from URL, e.g. "acme-corp" from "linkedin.com/company/acme-corp"
  const slugMatch = companyUrl.match(/company\/([^/?\s]+)/);
  const companySlug = slugMatch ? slugMatch[1].toLowerCase() : '';

  const lowerText = text.toLowerCase();

  // Check for @mention of company (LinkedIn uses @Company Name format)
  if (lowerText.includes(`@${companySlug.replace(/-/g, ' ')}`)) return true;
  if (lowerText.includes(`@${companySlug}`)) return true;

  // Check for explicit company URL reference
  if (companySlug && lowerText.includes(companySlug)) return true;

  // Check for the full company URL
  const normalizedCompanyUrl = companyUrl.toLowerCase().replace(/\/+$/, '');
  if (lowerText.includes(normalizedCompanyUrl)) return true;

  return false;
}

export function mapPostToDatabase(
  post: ApifyPostOutput,
  companyUrl: string,
): MappedPost | null {
  const linkedinPostId = post.postId || post.urn || post.id || '';
  const linkedinUrl = post.url || post.postUrl || '';

  if (!linkedinPostId && !linkedinUrl) return null;

  const textContent = post.text || post.textContent || post.content || '';
  const likes = post.likes ?? post.numLikes ?? 0;
  const comments = post.comments ?? post.numComments ?? 0;
  const shares = post.shares ?? post.numShares ?? post.reposts ?? 0;

  const publishedAtRaw = post.publishedAt || post.postedAt || post.date || post.createdAt;
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();

  const mediaUrls = post.images || (post.media as string[] | undefined) || null;
  const hashtags = post.hashtags || extractHashtags(textContent);

  return {
    linkedinPostId: linkedinPostId || linkedinUrl,
    linkedinUrl: linkedinUrl || `https://linkedin.com/feed/update/${linkedinPostId}`,
    type: mapPostType(post.type || post.postType),
    textContent,
    publishedAt,
    likes,
    comments,
    shares,
    engagementScore: calculateEngagementScore(likes, comments, shares),
    mentionsCompany: detectCompanyMention(textContent, companyUrl),
    mediaUrls: mediaUrls && mediaUrls.length > 0 ? mediaUrls as string[] : null,
    hashtags: hashtags.length > 0 ? hashtags : null,
  };
}

export interface PostScrapeResult {
  runId: string;
  posts: MappedPost[];
}

export async function scrapePostsForProfile(
  profileUrl: string,
): Promise<PostScrapeResult> {
  const input: PostScraperInput = { targetUrls: [profileUrl] };

  const result: ActorRunResult<ApifyPostOutput> = await runActor(ACTOR_ID, input);

  const companyUrl = ''; // Will be passed from orchestrator
  const posts = result.items
    .map((item) => mapPostToDatabase(item, companyUrl))
    .filter((p): p is MappedPost => p !== null);

  return {
    runId: result.runId,
    posts,
  };
}

export async function scrapePostsForProfiles(
  profiles: Array<{ profileUrl: string; authorId: string }>,
  companyUrl: string,
): Promise<{ runIds: string[]; postsByAuthor: Map<string, MappedPost[]> }> {
  const runIds: string[] = [];
  const postsByAuthor = new Map<string, MappedPost[]>();

  for (let i = 0; i < profiles.length; i++) {
    const { profileUrl, authorId } = profiles[i];

    const input: PostScraperInput = { targetUrls: [profileUrl] };

    const result: ActorRunResult<ApifyPostOutput> = await runActor(ACTOR_ID, input);
    runIds.push(result.runId);

    const posts = result.items
      .map((item) => mapPostToDatabase(item, companyUrl))
      .filter((p): p is MappedPost => p !== null);

    postsByAuthor.set(authorId, posts);

    // Sleep between profiles (but not after the last one)
    if (i < profiles.length - 1) {
      await sleep(PROFILE_DELAY_MS);
    }
  }

  return { runIds, postsByAuthor };
}
