'use client';

import { useMemo } from 'react';
import { Flame, Disc3, Heart } from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';
import CarouselRow from '@/components/hits/CarouselRow';
import HitCard from '@/components/hits/HitCard';
import FeaturedHitCard from '@/components/hits/FeaturedHitCard';
import Skeleton from '@/components/ui/Skeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Hit {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;
  department: string;
  textContent: string;
  publishedAt: string;
  url: string;
  likes: number;
  comments: number;
  shares: number;
  engagementScore: number;
  mentionsCompany: boolean;
  isExternal: boolean;
}

export default function HitsPage() {
  const { data: hits, isLoading } = useSWR<Hit[]>('/api/hits', fetcher);

  const topHit = hits?.[0] ?? null;
  const totalHits = hits?.length ?? 0;
  const totalLikes = hits?.reduce((sum, h) => sum + h.likes, 0) ?? 0;

  // ── Carousel data ──

  // "Employees" — group by employee, show top hit per employee (exclude Content Engineering and external)
  const employeeHits = useMemo(() => {
    if (!hits) return [];
    const byEmployee = new Map<string, Hit>();
    for (const h of hits) {
      if (h.isExternal || !h.authorId) continue;
      if (h.department === 'Content Engineering') continue;
      const existing = byEmployee.get(h.authorId);
      if (!existing || h.likes > existing.likes) {
        byEmployee.set(h.authorId, h);
      }
    }
    return [...byEmployee.values()].sort((a, b) => b.likes - a.likes);
  }, [hits]);

  // "Company" — hits that mention the company
  const companyHits = useMemo(() => {
    if (!hits) return [];
    return hits.filter(h => h.mentionsCompany).sort((a, b) => b.likes - a.likes);
  }, [hits]);

  // Per-department hits — one carousel per department that has hits
  const departmentGroups = useMemo(() => {
    if (!hits) return [];
    const byDept = new Map<string, Hit[]>();
    for (const h of hits) {
      if (!h.department) continue;
      const existing = byDept.get(h.department) ?? [];
      existing.push(h);
      byDept.set(h.department, existing);
    }
    return [...byDept.entries()]
      .map(([dept, deptHits]) => ({ department: dept, hits: deptHits.sort((a, b) => b.likes - a.likes) }))
      .sort((a, b) => b.hits.length - a.hits.length);
  }, [hits]);

  // Featured cards — top employee hit and top external hit
  const topEmployeeHit = useMemo(() => {
    if (!hits) return null;
    return hits.find(h => !h.isExternal) ?? null;
  }, [hits]);

  const topExternalHit = useMemo(() => {
    if (!hits) return null;
    return hits.find(h => h.isExternal) ?? null;
  }, [hits]);

  return (
    <div className="space-y-8">
      {/* ── Hero Section (Fred again.. artist page style) ── */}
      <div className="relative overflow-hidden rounded-xl min-h-[340px]">
        {/* Background image — blurred top hit avatar */}
        {topHit && (
          <Image
            src={topHit.authorAvatar}
            alt=""
            fill
            className="object-cover scale-110 blur-sm brightness-[0.3]"
            sizes="100vw"
            priority
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2e1a]/80 to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col justify-end h-full min-h-[340px] p-8">
          {/* Verified badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-medium text-white">Verified Collection</span>
          </div>

          {/* Title */}
          <h1 className="text-7xl font-extrabold text-white tracking-tight leading-none mb-4">
            All Time Hits
          </h1>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-neutral-300">
            <span className="inline-flex items-center gap-1.5">
              <Disc3 className="w-4 h-4 text-[#4ade80]" />
              <span className="font-semibold text-white">{totalHits} hits</span>
            </span>
            <span className="text-neutral-500">&middot;</span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-400" />
              <span>{totalLikes.toLocaleString()} total reactions</span>
            </span>
            {topHit && (
              <>
                <span className="text-neutral-500">&middot;</span>
                <span>
                  Top hit by <span className="font-semibold text-white">{topHit.authorName}</span> with {topHit.likes.toLocaleString()} reactions
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Featured Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-72" />
          <Skeleton variant="card" className="h-72" />
        </div>
      ) : (topEmployeeHit || topExternalHit) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topEmployeeHit && (
            <FeaturedHitCard
              label="Top Employee Post"
              authorName={topEmployeeHit.authorName}
              authorTitle={topEmployeeHit.authorTitle}
              authorAvatar={topEmployeeHit.authorAvatar}
              textContent={topEmployeeHit.textContent}
              likes={topEmployeeHit.likes}
              postUrl={topEmployeeHit.url}
            />
          )}
          {topExternalHit && (
            <FeaturedHitCard
              label="Top External Post"
              authorName={topExternalHit.authorName}
              authorTitle={topExternalHit.authorTitle}
              authorAvatar={topExternalHit.authorAvatar}
              textContent={topExternalHit.textContent}
              likes={topExternalHit.likes}
              postUrl={topExternalHit.url}
            />
          )}
        </div>
      )}

      {/* ── Carousel Sections ── */}
      {isLoading ? (
        <div className="space-y-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton variant="card" className="h-6 w-48" />
              <div className="flex gap-4">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} variant="card" className="w-44 h-56 flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Employees */}
          {employeeHits.length > 0 && (
            <CarouselRow title="Employees">
              {employeeHits.map(h => (
                <HitCard
                  key={h.id}
                  avatarUrl={h.authorAvatar}
                  title={h.authorName}
                  subtitle={`${h.likes.toLocaleString()} reactions — "${h.textContent.slice(0, 50)}..."`}
                  likes={h.likes}
                  postUrl={h.url}
                />
              ))}
            </CarouselRow>
          )}

          {/* Trending */}
          {companyHits.length > 0 && (
            <CarouselRow title="Trending">
              {companyHits.map(h => (
                <HitCard
                  key={h.id}
                  avatarUrl={h.authorAvatar}
                  title={h.authorName}
                  subtitle={h.textContent.length > 60 ? h.textContent.slice(0, 60) + '...' : h.textContent}
                  likes={h.likes}
                  postUrl={h.url}
                />
              ))}
            </CarouselRow>
          )}

          {/* Per-department carousels */}
          {departmentGroups.map(({ department, hits: deptHits }) => (
            <CarouselRow key={department} title={`${department} Department`}>
              {deptHits.map(h => (
                <HitCard
                  key={h.id}
                  avatarUrl={h.authorAvatar}
                  title={h.authorName}
                  subtitle={h.textContent.length > 60 ? h.textContent.slice(0, 60) + '...' : h.textContent}
                  likes={h.likes}
                  postUrl={h.url}
                />
              ))}
            </CarouselRow>
          ))}

          {totalHits === 0 && (
            <div className="text-center py-16 text-neutral-400">
              <Flame className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
              <p className="text-lg font-medium">No hits yet</p>
              <p className="text-sm mt-1">Posts with 100+ reactions will appear here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
