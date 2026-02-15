import { NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';
import { seedExternalPosts } from '@/lib/data/seed-posts';

export async function GET() {
  const provider = getDataProvider();
  const [posts, employees] = await Promise.all([
    provider.getAllPosts(),
    provider.getEmployees(),
  ]);

  const empMap = new Map(employees.map(e => [e.id, e]));

  // Employee posts with 100+ likes
  const employeeHits = posts
    .filter(p => p.engagement.likes >= 100)
    .map(p => {
      const emp = empMap.get(p.authorId);
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
      };
    });

  // External posts with 100+ likes
  const externalHits = seedExternalPosts
    .filter(p => p.engagement.likes >= 100)
    .map(p => ({
      id: p.id,
      authorId: p.authorId,
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      authorTitle: p.authorTitle,
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
    }));

  const allHits = [...employeeHits, ...externalHits].sort((a, b) => b.likes - a.likes);

  return NextResponse.json(allHits);
}
