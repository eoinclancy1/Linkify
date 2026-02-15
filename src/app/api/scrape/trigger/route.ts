import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { ScrapeOrchestrator } from '@/lib/scraping/orchestrator';

// Allow up to 5 minutes for scrape operations
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type?: string };

    if (!type || !['full', 'discovery', 'profiles', 'posts', 'mentions'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: full, discovery, profiles, posts, mentions' },
        { status: 400 },
      );
    }

    const orchestrator = new ScrapeOrchestrator();

    // Run after the response is sent — keeps the function alive on Vercel
    after(async () => {
      try {
        switch (type) {
          case 'full':
            await orchestrator.runFullSync();
            break;
          case 'discovery':
            await orchestrator.discoverNewEmployees();
            break;
          case 'profiles':
            await orchestrator.scrapeAllProfiles();
            break;
          case 'posts':
            await orchestrator.scrapeAllPosts();
            await orchestrator.updateCompanyMentions();
            await orchestrator.refreshPostingActivities();
            break;
          case 'mentions':
            await orchestrator.searchExternalMentions();
            await orchestrator.updateCompanyMentions();
            break;
        }
      } catch (err) {
        console.error(`Scrape (${type}) failed:`, err);
      }
    });

    return NextResponse.json({ status: 'started', type });
  } catch (error) {
    console.error('Scrape trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to start scrape' },
      { status: 500 },
    );
  }
}
