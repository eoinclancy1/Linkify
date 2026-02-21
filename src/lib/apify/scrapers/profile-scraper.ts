import { runActor, sleep, type ActorRunResult } from '@/lib/apify/client';
import { sanitizeForDb } from '@/lib/utils/formatting';
import type { Department } from '@prisma/client';

const ACTOR_ID = 'harvestapi/linkedin-profile-scraper';
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 10_000;

interface ProfileScraperInput {
  urls: string[];
}

interface ApifyProfileOutput {
  url?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  headline?: string;
  about?: string;
  summary?: string;
  jobTitle?: string;
  title?: string;
  profilePicture?: string | { url?: string; sizes?: unknown };
  profileImageUrl?: string | { url?: string; sizes?: unknown };
  profilePictureUrl?: string | { url?: string; sizes?: unknown };
  avatarUrl?: string | { url?: string; sizes?: unknown };
  img?: string | { url?: string; sizes?: unknown };
  experience?: unknown[];
  education?: unknown[];
  skills?: unknown[] | string[];
}

/** Extract a plain URL string from a field that may be a string or { url: "..." } object */
function extractUrl(field: string | { url?: string } | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.url ?? '';
}

export interface MappedProfile {
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  about: string;
  jobTitle: string;
  department: Department;
  avatarUrl: string;
  experience: unknown[] | null;
  education: unknown[] | null;
  skills: unknown[] | null;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Extract the employee's start date at the current company from their experience data.
 * Matches on companyLinkedinUrl slug or falls back to current role (endDate.text === "Present").
 */
export function extractCompanyStartDate(
  experience: unknown[] | null,
  companyUrl: string,
): Date | null {
  if (!experience || !Array.isArray(experience) || experience.length === 0) return null;

  // Extract slug from company URL (e.g. "airopshq" from ".../company/airopshq/")
  const slugMatch = companyUrl.match(/company\/([^/?]+)/);
  const companySlug = slugMatch?.[1]?.toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ExpEntry = any;

  // First pass: match by company LinkedIn URL slug
  if (companySlug) {
    for (const entry of experience as ExpEntry[]) {
      const entryUrl = (entry.companyLinkedinUrl || '').toLowerCase();
      if (entryUrl.includes(companySlug)) {
        const date = parseStartDate(entry.startDate);
        if (date) return date;
      }
    }
  }

  // Second pass: fallback to current role (endDate.text === "Present")
  for (const entry of experience as ExpEntry[]) {
    const endText = entry.endDate?.text || entry.endDate || '';
    if (typeof endText === 'string' && endText.toLowerCase().includes('present')) {
      const date = parseStartDate(entry.startDate);
      if (date) return date;
    }
  }

  return null;
}

function parseStartDate(startDate: unknown): Date | null {
  if (!startDate || typeof startDate !== 'object') return null;
  const sd = startDate as { month?: string; year?: number; text?: string };

  const year = sd.year;
  if (!year || typeof year !== 'number') return null;

  const monthStr = (sd.month || '').toLowerCase().slice(0, 3);
  const month = MONTH_MAP[monthStr] ?? 0; // Default to January if month not parseable

  return new Date(year, month, 1);
}

/** Infer role from headline — advisors, consultants, fractional roles → ADVISOR */
export function inferRole(headline: string): 'EMPLOYEE' | 'ADVISOR' {
  const h = headline.toLowerCase();
  // If headline contains advisor/consultant/fractional keywords, classify as ADVISOR
  // Only override to EMPLOYEE if a senior title (VP, Director, etc.) appears near "airops"
  if (/\b(advisor|consultant|fractional)\b/i.test(h)) {
    // Check if a senior title is directly associated with AirOps (e.g. "VP Growth at AirOps")
    if (/\b(vp|vice president|head of|director|manager|lead)\b.*airops/i.test(h)) {
      return 'EMPLOYEE';
    }
    return 'ADVISOR';
  }
  return 'EMPLOYEE';
}

function inferDepartment(headline: string): Department {
  const h = headline.toLowerCase();

  // CONTENT_ENGINEERING — advisors, consultants, fractional roles
  // Only match if they don't also hold a senior internal title (VP, Head, Director, etc.)
  if (/\b(advisor|consultant|fractional)\b/i.test(h) &&
      !/\b(vp|vice president|head of|director|manager|lead)\b/i.test(h)) {
    return 'CONTENT_ENGINEERING';
  }

  // LEADERSHIP — match founders, C-suite, board members first
  // "chief of staff" is OPERATIONS, not LEADERSHIP, so exclude it here
  if (/\b(ceo|coo|cfo|cto|cpo|cmo|co-?founder|founder|board\b)/i.test(h)) {
    return 'LEADERSHIP';
  }
  if (/\b(chief)\b/i.test(h) && !/chief of staff/i.test(h)) {
    return 'LEADERSHIP';
  }
  if (/\bleading\b.*\b(vertical|startup|company)/i.test(h)) {
    return 'LEADERSHIP';
  }

  // PEOPLE — talent, recruiting, HR
  if (/\b(talent|recruiting|recruiter|hr\b|human resources|people\b|\bta\b)/i.test(h)) {
    return 'PEOPLE';
  }

  // PARTNERSHIPS — alliances, channel, partnerships
  if (/\b(partner(?:ship)?s?|alliances|channel\b)/i.test(h)) {
    return 'PARTNERSHIPS';
  }

  // DATA — analytics, dbt, BI, data
  if (/\b(data\b|analytics|dbt|business intelligence|\bbi\b)/i.test(h)) {
    return 'DATA';
  }

  // OPERATIONS — ops, finance, chief of staff, strategy, revops
  if (/\b(operations|ops\b|finance|chief of staff|strategy|revops|expansion)/i.test(h)) {
    return 'OPERATIONS';
  }

  // DESIGN — check "creative director" before MARKETING grabs "brand"
  if (/\bcreative director\b/i.test(h)) {
    return 'DESIGN';
  }

  // MARKETING — growth, content, SEO, brand, social, AEO, GEO, GTM
  // Must come before ENGINEERING so "content engineering" and "GTM engineering" match here
  if (/\b(market|growth|content|seo|brand|social|cmo|aeo|geo|gtm)\b/i.test(h)) {
    return 'MARKETING';
  }

  // ENGINEERING — software, devops, SRE, etc.
  // "architect" only matches with software/solutions/system prefix
  if (/\b(engineer|developer|software|devops|sre|backend|frontend|full.?stack)\b/i.test(h)) {
    return 'ENGINEERING';
  }
  if (/\b(software|solutions?|systems?)\s+architect/i.test(h)) {
    return 'ENGINEERING';
  }

  // SALES
  if (/\b(sales|account exec|business develop|sdr|bdr|revenue|ae)\b/i.test(h)) {
    return 'SALES';
  }

  // PRODUCT
  if (/\b(product|pm)\b|product manag|product lead/i.test(h)) {
    return 'PRODUCT';
  }

  // DESIGN
  if (/\b(design|ux|ui|creative|illustrat)/i.test(h)) {
    return 'DESIGN';
  }

  return 'OTHER';
}

function parseName(raw: string): { firstName: string; lastName: string } {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function mapProfileToEmployee(profile: ApifyProfileOutput): MappedProfile | null {
  const linkedinUrl = profile.url || profile.linkedinUrl || '';
  if (!linkedinUrl) return null;

  const fullName = profile.fullName || profile.name || '';
  const { firstName, lastName } = profile.firstName && profile.lastName
    ? { firstName: profile.firstName, lastName: profile.lastName }
    : parseName(fullName);

  const headline = sanitizeForDb(profile.headline || '');
  const jobTitle = sanitizeForDb(profile.jobTitle || profile.title || headline.split(' at ')[0] || '');

  return {
    linkedinUrl: linkedinUrl.replace(/\/+$/, '').split('?')[0],
    firstName: sanitizeForDb(firstName),
    lastName: sanitizeForDb(lastName),
    fullName: sanitizeForDb(fullName || `${firstName} ${lastName}`.trim()),
    headline,
    about: sanitizeForDb(profile.about || profile.summary || ''),
    jobTitle,
    department: inferDepartment(headline),
    avatarUrl: extractUrl(profile.profilePicture) || extractUrl(profile.profileImageUrl) || extractUrl(profile.profilePictureUrl) || extractUrl(profile.avatarUrl) || extractUrl(profile.img),
    experience: profile.experience ?? null,
    education: profile.education ?? null,
    skills: profile.skills ?? null,
  };
}

export interface ProfileScrapeResult {
  runIds: string[];
  profiles: MappedProfile[];
  costUsd: number;
}

export async function scrapeProfiles(profileUrls: string[]): Promise<ProfileScrapeResult> {
  const allProfiles: MappedProfile[] = [];
  const runIds: string[] = [];
  let totalCost = 0;

  // Batch profiles
  for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
    const batch = profileUrls.slice(i, i + BATCH_SIZE);

    const result: ActorRunResult<ApifyProfileOutput> = await runActor(
      ACTOR_ID,
      { urls: batch } satisfies ProfileScraperInput,
    );

    runIds.push(result.runId);
    totalCost += result.costUsd;

    for (const item of result.items) {
      const mapped = mapProfileToEmployee(item);
      if (mapped) allProfiles.push(mapped);
    }

    // Sleep between batches (but not after the last one)
    if (i + BATCH_SIZE < profileUrls.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { runIds, profiles: allProfiles, costUsd: totalCost };
}
