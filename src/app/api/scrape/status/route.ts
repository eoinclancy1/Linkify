import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const runId = searchParams.get('runId');

    if (runId) {
      const run = await prisma.scrapeRun.findUnique({ where: { id: runId } });
      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      return NextResponse.json(run);
    }

    const runs = await prisma.scrapeRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Scrape status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape status' },
      { status: 500 },
    );
  }
}
