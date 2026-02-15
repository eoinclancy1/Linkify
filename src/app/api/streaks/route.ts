import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');
  const provider = getDataProvider();

  if (employeeId) {
    const streak = await provider.getStreak(employeeId);
    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }
    return NextResponse.json(streak);
  }

  const streaks = await provider.getAllStreaks();
  return NextResponse.json(streaks);
}
