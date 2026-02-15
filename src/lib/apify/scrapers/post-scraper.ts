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
  shareUrn?: string;
  entityId?: string;
  url?: string;
  postUrl?: string;
  linkedinUrl?: string;
  text?: string;
  textContent?: string;
  content?: string;
  // postedAt can be a string OR an object { timestamp, date, ... } from harvestapi
  publishedAt?: string | number;
  postedAt?: string | number | { timestamp?: number; date?: string };
  date?: string | number;
  createdAt?: string | number;
  // Engagement can be top-level or nested in an "engagement" object
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
  type?: string;
  postType?: string;
  isRepost?: boolean;
  media?: unknown[];
  images?: string[];
  postImages?: unknown[];
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

/** Parse a count field that may be a number or an array of objects */
function toCount(value: number | unknown[] | undefined, fallback?: number): number {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length;
  return fallback ?? 0;
}

/** Extract a date from the postedAt field which may be a string, number, or object */
function extractPostedAt(raw: string | number | { timestamp?: number; date?: string } | undefined): Date | null {
  if (!raw) return null;
  if (typeof raw === 'object' && raw !== null) {
    // harvestapi returns { timestamp, date, postedAgoShort, postedAgoText }
    if (raw.date) {
      const d = new Date(raw.date);
      if (!isNaN(d.getTime())) return d;
    }
    if (raw.timestamp) {
      return new Date(raw.timestamp < 1e12 ? raw.timestamp * 1000 : raw.timestamp);
    }
    return null;
  }
  return parseDate(raw);
}

/** Parse a date that may be an ISO string or unix timestamp (ms or s) */
function parseDate(raw: string | number | undefined): Date | null {
  if (!raw) return null;
  if (typeof raw === 'number') {
    // Unix timestamp: if < 1e12, it's in seconds; otherwise milliseconds
    return new Date(raw < 1e12 ? raw * 1000 : raw);
  }
  // Try parsing as-is
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function isRepost(post: ApifyPostOutput): boolean {
  if (post.isRepost === true) return true;
  const type = (post.type || post.postType || '').toLowerCase();
  return type.includes('reshare') || type.includes('repost');
}

export function mapPostToDatabase(
  post: ApifyPostOutput,
  companyUrl: string,
): MappedPost | null {
  // Exclude reposts
  if (isRepost(post)) return null;

  const linkedinPostId = post.postId || post.shareUrn || post.urn || post.entityId || post.id || '';
  const linkedinUrl = post.linkedinUrl || post.url || post.postUrl || '';

  if (!linkedinPostId && !linkedinUrl) return null;

  const textContent = post.text || post.textContent || post.content || '';

  // Engagement: check nested "engagement" object first (harvestapi format), then top-level
  const eng = post.engagement;
  const likes = eng?.likes ?? post.likes ?? post.numLikes ?? 0;
  const comments = eng?.comments ?? toCount(post.comments, post.numComments);
  const shares = eng?.shares ?? post.shares ?? post.numShares ?? post.repostCount ?? post.reposts ?? 0;

  // Date: postedAt may be an object { timestamp, date } from harvestapi
  const publishedAt =
    extractPostedAt(post.postedAt) ??
    parseDate(post.publishedAt) ??
    parseDate(post.date) ??
    parseDate(post.createdAt) ??
    new Date();

  const mediaUrls = post.images || (post.postImages as string[] | undefined) || (post.media as string[] | undefined) || null;
  const hashtags = post.hashtags || extractHashtags(textContent);

  return {
    linkedinPostId: linkedinPostId || linkedinUrl,
    linkedinUrl: linkedinUrl || `https://www.linkedin.com/feed/update/${linkedinPostId}`,
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
): Promise<{ runIds: string[]; postsByAuthor: Map<string, MappedPost[]>; costUsd: number }> {
  const runIds: string[] = [];
  const postsByAuthor = new Map<string, MappedPost[]>();
  let totalCost = 0;

  for (let i = 0; i < profiles.length; i++) {
    const { profileUrl, authorId } = profiles[i];

    const input: PostScraperInput = { targetUrls: [profileUrl] };

    const result: ActorRunResult<ApifyPostOutput> = await runActor(ACTOR_ID, input);
    runIds.push(result.runId);
    totalCost += result.costUsd;

    const posts = result.items
      .map((item) => mapPostToDatabase(item, companyUrl))
      .filter((p): p is MappedPost => p !== null);

    postsByAuthor.set(authorId, posts);

    // Sleep between profiles (but not after the last one)
    if (i < profiles.length - 1) {
      await sleep(PROFILE_DELAY_MS);
    }
  }

  return { runIds, postsByAuthor, costUsd: totalCost };
}
