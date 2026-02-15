import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');
  const range = searchParams.get('range');
  const days = range ? parseInt(range, 10) : undefined;
  const provider = getDataProvider();

  if (employeeId) {
    const posts = await provider.getPostsByEmployee(employeeId, days);
    return NextResponse.json(posts);
  }

  const posts = await provider.getAllPosts(days);
  return NextResponse.json(posts);
}
