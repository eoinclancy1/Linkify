import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const range = parseInt(searchParams.get('range') ?? '30', 10);
  const sort = (searchParams.get('sort') ?? 'engagement') as
    | 'engagement'
    | 'likes'
    | 'comments'
    | 'shares'
    | 'recent';

  const externalOnly = searchParams.get('external') === 'true';

  const provider = getDataProvider();
  const mentions = await provider.getCompanyMentions(range, sort, externalOnly);
  return NextResponse.json(mentions);
}
