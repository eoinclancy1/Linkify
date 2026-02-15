import { runActor, sleep, type ActorRunResult } from '@/lib/apify/client';
import type { Department } from '@prisma/client';

const ACTOR_ID = 'curious_coder/linkedin-profile-scraper';
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
  profilePicture?: string;
  profileImageUrl?: string;
  avatarUrl?: string;
  experience?: unknown[];
  education?: unknown[];
  skills?: unknown[] | string[];
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

function inferDepartment(headline: string): Department {
  const h = headline.toLowerCase();
  if (/engineer|developer|software|devops|sre|backend|frontend|full.?stack|architect|cto/i.test(h)) {
    return 'ENGINEERING';
  }
  if (/market|growth|content|seo|brand|social media|cmо/i.test(h)) {
    return 'MARKETING';
  }
  if (/sales|account exec|business develop|sdr|bdr|revenue|ae\b/i.test(h)) {
    return 'SALES';
  }
  if (/product|pm\b|product manag|product lead|cpo/i.test(h)) {
    return 'PRODUCT';
  }
  if (/design|ux|ui|creative|illustrat/i.test(h)) {
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

  const headline = profile.headline || '';
  const jobTitle = profile.jobTitle || profile.title || headline.split(' at ')[0] || '';

  return {
    linkedinUrl: linkedinUrl.replace(/\/+$/, '').split('?')[0],
    firstName,
    lastName,
    fullName: fullName || `${firstName} ${lastName}`.trim(),
    headline,
    about: profile.about || profile.summary || '',
    jobTitle,
    department: inferDepartment(headline),
    avatarUrl: profile.profilePicture || profile.profileImageUrl || profile.avatarUrl || '',
    experience: profile.experience ?? null,
    education: profile.education ?? null,
    skills: profile.skills ?? null,
  };
}

export interface ProfileScrapeResult {
  runIds: string[];
  profiles: MappedProfile[];
}

export async function scrapeProfiles(profileUrls: string[]): Promise<ProfileScrapeResult> {
  const allProfiles: MappedProfile[] = [];
  const runIds: string[] = [];

  // Batch profiles
  for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
    const batch = profileUrls.slice(i, i + BATCH_SIZE);

    const result: ActorRunResult<ApifyProfileOutput> = await runActor(
      ACTOR_ID,
      { urls: batch } satisfies ProfileScraperInput,
    );

    runIds.push(result.runId);

    for (const item of result.items) {
      const mapped = mapProfileToEmployee(item);
      if (mapped) allProfiles.push(mapped);
    }

    // Sleep between batches (but not after the last one)
    if (i + BATCH_SIZE < profileUrls.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { runIds, profiles: allProfiles };
}
