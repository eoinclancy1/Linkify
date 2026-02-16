import { runActor, sleep, type ActorRunResult } from '@/lib/apify/client';
import { calculateEngagementScore } from '@/lib/utils/engagement';
import { sanitizeForDb } from '@/lib/utils/formatting';
import type { PostType } from '@prisma/client';

const ACTOR_ID = 'harvestapi/linkedin-profile-posts';
const PROFILE_DELAY_MS = 5_000;

interface PostScraperInput {
  targetUrls: string[];
  postedLimit?: string;
  maxPosts?: number;
  includeReposts?: boolean;
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
  author?: {
    publicIdentifier?: string;
    linkedinUrl?: string;
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

/** Extract the /in/slug from a LinkedIn profile URL */
function extractProfileSlug(url: string): string {
  const match = url.match(/\/in\/([^/?]+)/);
  return match ? match[1].toLowerCase() : '';
}

/** Check if the post was actually authored by the profile we scraped */
function isAuthoredBy(post: ApifyPostOutput, profileUrl: string): boolean {
  const expectedSlug = extractProfileSlug(profileUrl);
  if (!expectedSlug) return true; // Can't verify, allow through

  // Check author.publicIdentifier (most reliable)
  if (post.author?.publicIdentifier) {
    return post.author.publicIdentifier.toLowerCase() === expectedSlug;
  }

  // Check author.linkedinUrl
  if (post.author?.linkedinUrl) {
    return extractProfileSlug(post.author.linkedinUrl) === expectedSlug;
  }

  // Check if author is a company (type: 'company') — never belongs to a person
  if (post.author?.type === 'company') {
    return false;
  }

  // Fallback: check the post URL contains the profile slug
  const postUrl = post.linkedinUrl || post.url || post.postUrl || '';
  if (postUrl.includes('/posts/')) {
    const postSlug = postUrl.split('/posts/')[1]?.split('_')[0]?.toLowerCase() || '';
    return postSlug === expectedSlug;
  }

  return true; // Can't determine, allow through
}

export function mapPostToDatabase(
  post: ApifyPostOutput,
  companyUrl: string,
  profileUrl?: string,
): MappedPost | null {
  // Exclude reposts
  if (isRepost(post)) return null;

  // Exclude posts not authored by the target profile
  if (profileUrl && !isAuthoredBy(post, profileUrl)) return null;

  const linkedinPostId = post.postId || post.shareUrn || post.urn || post.entityId || post.id || '';
  const linkedinUrl = post.linkedinUrl || post.url || post.postUrl || '';

  if (!linkedinPostId && !linkedinUrl) return null;

  const textContent = sanitizeForDb(post.text || post.textContent || post.content || '');

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
  companyUrl: string,
): Promise<PostScrapeResult> {
  const input: PostScraperInput = {
    targetUrls: [profileUrl],
    postedLimit: 'month',
    maxPosts: 0,
    includeReposts: false,
  };

  const result: ActorRunResult<ApifyPostOutput> = await runActor(ACTOR_ID, input);

  const posts = result.items
    .map((item) => mapPostToDatabase(item, companyUrl, profileUrl))
    .filter((p): p is MappedPost => p !== null);

  return {
    runId: result.runId,
    posts,
  };
}

/**
 * Resolve which authorId a post belongs to by matching the post's author slug
 * against the known profile URLs. Returns null if no match found.
 */
function resolveAuthorId(
  post: ApifyPostOutput,
  slugToAuthorId: Map<string, string>,
): string | null {
  // Try author.publicIdentifier first (most reliable)
  if (post.author?.publicIdentifier) {
    const id = slugToAuthorId.get(post.author.publicIdentifier.toLowerCase());
    if (id) return id;
  }

  // Try author.linkedinUrl
  if (post.author?.linkedinUrl) {
    const slug = extractProfileSlug(post.author.linkedinUrl);
    if (slug) {
      const id = slugToAuthorId.get(slug);
      if (id) return id;
    }
  }

  // Try post URL (e.g. /posts/john-doe_some-activity)
  const postUrl = post.linkedinUrl || post.url || post.postUrl || '';
  if (postUrl.includes('/posts/')) {
    const postSlug = postUrl.split('/posts/')[1]?.split('_')[0]?.toLowerCase() || '';
    if (postSlug) {
      const id = slugToAuthorId.get(postSlug);
      if (id) return id;
    }
  }

  return null;
}

export async function scrapePostsForProfiles(
  profiles: Array<{ profileUrl: string; authorId: string }>,
  companyUrl: string,
): Promise<{ runIds: string[]; postsByAuthor: Map<string, MappedPost[]>; costUsd: number }> {
  if (profiles.length === 0) {
    return { runIds: [], postsByAuthor: new Map(), costUsd: 0 };
  }

  // Build slug → authorId lookup for attribution
  const slugToAuthorId = new Map<string, string>();
  for (const { profileUrl, authorId } of profiles) {
    const slug = extractProfileSlug(profileUrl);
    if (slug) slugToAuthorId.set(slug, authorId);
  }

  // Send all profile URLs in a single actor call
  const input: PostScraperInput = {
    targetUrls: profiles.map((p) => p.profileUrl),
    postedLimit: 'month',
    maxPosts: 0,
    includeReposts: false,
  };

  const result: ActorRunResult<ApifyPostOutput> = await runActor(ACTOR_ID, input);

  // Attribute each post to the correct author
  const postsByAuthor = new Map<string, MappedPost[]>();
  for (const { authorId } of profiles) {
    postsByAuthor.set(authorId, []);
  }

  for (const item of result.items) {
    if (isRepost(item)) continue;

    // Skip company-authored posts
    if (item.author?.type === 'company') continue;

    const authorId = resolveAuthorId(item, slugToAuthorId);
    if (!authorId) continue;

    const mapped = mapPostToDatabase(item, companyUrl);
    if (!mapped) continue;

    postsByAuthor.get(authorId)!.push(mapped);
  }

  return { runIds: [result.runId], postsByAuthor, costUsd: result.costUsd };
}
