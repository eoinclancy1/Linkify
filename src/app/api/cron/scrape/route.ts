import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ScrapeOrchestrator } from '@/lib/scraping/orchestrator';

// Allow up to 5 minutes for scrape operations
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orchestrator = new ScrapeOrchestrator();
    await orchestrator.runFullSync();

    return NextResponse.json({ status: 'completed' });
  } catch (error) {
    console.error('Cron scrape error:', error);
    return NextResponse.json(
      { error: 'Scrape failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
