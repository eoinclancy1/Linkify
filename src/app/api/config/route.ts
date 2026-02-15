import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const config = await prisma.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyLinkedinUrl, companyName, scrapeEnabled, scrapeHistoryDays, vercelMonthlyCostUsd, mentionBonusMultiplier } = body as {
      companyLinkedinUrl?: string;
      companyName?: string;
      scrapeEnabled?: boolean;
      scrapeHistoryDays?: number;
      vercelMonthlyCostUsd?: number;
      mentionBonusMultiplier?: number;
    };

    const data: Record<string, unknown> = {};
    if (companyLinkedinUrl !== undefined) data.companyLinkedinUrl = companyLinkedinUrl;
    if (companyName !== undefined) data.companyName = companyName;
    if (scrapeEnabled !== undefined) data.scrapeEnabled = scrapeEnabled;
    if (scrapeHistoryDays !== undefined) data.scrapeHistoryDays = scrapeHistoryDays;
    if (vercelMonthlyCostUsd !== undefined) data.vercelMonthlyCostUsd = vercelMonthlyCostUsd;
    if (mentionBonusMultiplier !== undefined) data.mentionBonusMultiplier = mentionBonusMultiplier;

    const config = await prisma.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 },
    );
  }
}
