'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PostRow from '@/components/employees/PostRow';
import TopPostsCarousel from '@/components/employees/TopPostsCarousel';

export interface PostEntry {
  id: string;
  authorName: string;
  authorAvatar: string;
  textContent: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  postUrl: string;
}

type SortColumn = 'likes' | 'comments' | 'shares' | null;
type SortDirection = 'asc' | 'desc';

interface AllPostsTableProps {
  posts: PostEntry[];
}

export default function AllPostsTable({ posts }: AllPostsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedPosts = useMemo(() => {
    if (!sortColumn) return posts;
    const sorted = [...posts];
    sorted.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [posts, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) return null;
    return sortDirection === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  }

  return (
    <div className="space-y-4">
      {/* Spotlight carousel */}
      <TopPostsCarousel posts={posts} />

      {/* Column headers */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-neutral-500 uppercase tracking-wider">
        <div className="flex-shrink-0 w-40">Poster</div>
        <div className="flex-1">Post Preview</div>
        <div className="flex-shrink-0 w-28">Date</div>
        <button
          onClick={() => handleSort('likes')}
          className={`flex-shrink-0 w-16 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'likes' ? 'text-white' : ''}`}
        >
          Reactions<SortIcon column="likes" />
        </button>
        <button
          onClick={() => handleSort('comments')}
          className={`flex-shrink-0 w-16 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'comments' ? 'text-white' : ''}`}
        >
          Comments<SortIcon column="comments" />
        </button>
        <button
          onClick={() => handleSort('shares')}
          className={`flex-shrink-0 w-16 text-right cursor-pointer hover:text-white transition-colors ${sortColumn === 'shares' ? 'text-white' : ''}`}
        >
          Shares<SortIcon column="shares" />
        </button>
        <div className="flex-shrink-0 w-8">Link</div>
      </div>

      {/* Rows */}
      {sortedPosts.map((post) => (
        <PostRow
          key={post.id}
          authorName={post.authorName}
          authorAvatar={post.authorAvatar}
          textContent={post.textContent}
          publishedAt={post.publishedAt}
          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
          postUrl={post.postUrl}
        />
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          No posts found.
        </div>
      )}
    </div>
  );
}
