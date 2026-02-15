import { runActor, type ActorRunResult } from '@/lib/apify/client';

const ACTOR_ID = 'harvestapi/linkedin-company-employees';

interface EmployeeDiscoveryInput {
  companies: string[];
  takePages?: number;
}

interface EmployeeDiscoveryOutput {
  profileUrl?: string;
  linkedinUrl?: string;
  url?: string;
  name?: string;
  title?: string;
}

export interface DiscoveryResult {
  runId: string;
  profileUrls: string[];
  costUsd: number;
}

function normalizeLinkedinUrl(url: string): string {
  // Remove trailing slashes and query params
  return url.replace(/\/+$/, '').split('?')[0];
}

export async function discoverEmployees(companyUrl: string): Promise<DiscoveryResult> {
  const result: ActorRunResult<EmployeeDiscoveryOutput> = await runActor(
    ACTOR_ID,
    { companies: [companyUrl], takePages: 100 } satisfies EmployeeDiscoveryInput,
  );

  const profileUrls = result.items
    .map((item) => item.profileUrl || item.linkedinUrl || item.url || '')
    .filter((url) => url.includes('linkedin.com/in/'))
    .map(normalizeLinkedinUrl);

  // Deduplicate
  const unique = [...new Set(profileUrls)];

  return {
    runId: result.runId,
    profileUrls: unique,
    costUsd: result.costUsd,
  };
}
