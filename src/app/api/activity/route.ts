import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
  }

  const provider = getDataProvider();
  const activities = await provider.getPostingActivity(employeeId);
  return NextResponse.json(activities);
}
