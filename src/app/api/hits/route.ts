import { NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET() {
  const provider = getDataProvider();
  const [posts, employees, advisors] = await Promise.all([
    provider.getAllPosts(),
    provider.getEmployees(),
    provider.getAdvisors(),
  ]);

  const empMap = new Map(employees.map(e => [e.id, e]));
  const advisorMap = new Map(advisors.map(a => [a.id, a]));

  // Employee + advisor posts with 100+ likes
  const employeeHits = posts
    .filter(p => p.engagement.likes >= 100 && !p.isExternal)
    .map(p => {
      const emp = p.authorId ? (empMap.get(p.authorId) ?? advisorMap.get(p.authorId)) : null;
      const isAdvisor = p.authorId ? advisorMap.has(p.authorId) : false;
      return {
        id: p.id,
        authorId: p.authorId,
        authorName: emp?.fullName ?? 'Unknown',
        authorAvatar: emp?.avatarUrl ?? '',
        authorTitle: emp?.jobTitle ?? '',
        department: emp?.department ?? '',
        textContent: p.textContent,
        publishedAt: p.publishedAt,
        url: p.url,
        likes: p.engagement.likes,
        comments: p.engagement.comments,
        shares: p.engagement.shares,
        engagementScore: p.engagement.engagementScore,
        mentionsCompany: p.mentionsCompany,
        isExternal: false,
        isAdvisor,
      };
    });

  // External posts — from DB when using real data, from seed data when using mock
  let externalHits: typeof employeeHits = [];
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL) {
    const { seedExternalPosts } = await import('@/lib/data/seed-posts');
    externalHits = seedExternalPosts
      .filter(p => p.engagement.likes >= 100)
      .map(p => ({
        id: p.id,
        authorId: null,
        authorName: p.externalAuthorName ?? 'Unknown',
        authorAvatar: p.externalAuthorAvatarUrl ?? '',
        authorTitle: p.externalAuthorHeadline ?? '',
        department: '',
        textContent: p.textContent,
        publishedAt: p.publishedAt,
        url: p.url,
        likes: p.engagement.likes,
        comments: p.engagement.comments,
        shares: p.engagement.shares,
        engagementScore: p.engagement.engagementScore,
        mentionsCompany: p.mentionsCompany,
        isExternal: true,
        isAdvisor: false,
      }));
  } else {
    // Fetch external posts from DB using inline fields
    const { prisma } = await import('@/lib/db/prisma');
    const externalPosts = await prisma.post.findMany({
      where: { isExternal: true, likes: { gte: 100 } },
      orderBy: { likes: 'desc' },
    });
    externalHits = externalPosts.map(p => ({
      id: p.id,
      authorId: p.authorId,
      authorName: p.externalAuthorName ?? 'Unknown',
      authorAvatar: p.externalAuthorAvatarUrl ?? '',
      authorTitle: p.externalAuthorHeadline ?? '',
      department: '',
      textContent: p.textContent,
      publishedAt: p.publishedAt.toISOString(),
      url: p.linkedinUrl,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      engagementScore: p.engagementScore,
      mentionsCompany: p.mentionsCompany,
      isExternal: true,
      isAdvisor: false,
    }));
  }

  const allHits = [...employeeHits, ...externalHits].sort((a, b) => b.likes - a.likes);

  return NextResponse.json(allHits);
}
