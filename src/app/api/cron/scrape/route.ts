import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { ScrapeOrchestrator } from '@/lib/scraping/orchestrator';

// Allow up to 5 minutes for scrape operations
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ?type=weekly for the weekly full sync, otherwise daily light sync
  const type = request.nextUrl.searchParams.get('type') ?? 'daily';
  const orchestrator = new ScrapeOrchestrator();

  after(async () => {
    try {
      if (type === 'weekly') {
        await orchestrator.runWeeklySync();
      } else {
        await orchestrator.runDailySync();
      }
    } catch (err) {
      console.error(`Cron scrape (${type}) failed:`, err);
    }
  });

  return NextResponse.json({ status: 'started', type });
}
