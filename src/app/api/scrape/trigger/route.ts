import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ScrapeOrchestrator } from '@/lib/scraping/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type?: string };

    if (!type || !['full', 'profiles', 'posts'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: full, profiles, posts' },
        { status: 400 },
      );
    }

    const orchestrator = new ScrapeOrchestrator();

    // Run in the background - don't await
    const promise = (async () => {
      switch (type) {
        case 'full':
          await orchestrator.runFullSync();
          break;
        case 'profiles':
          await orchestrator.scrapeAllProfiles();
          break;
        case 'posts':
          await orchestrator.scrapeAllPosts();
          break;
      }
    })();

    // Don't block the response - let it run in background
    promise.catch((err) => {
      console.error(`Scrape (${type}) failed:`, err);
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
