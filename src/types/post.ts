import { EngagementMetrics } from './engagement';

export type PostType = 'original' | 'reshare' | 'article' | 'poll';

export interface Post {
  id: string;
  authorId: string | null;
  type: PostType;
  textContent: string;
  publishedAt: string; // ISO date string
  url: string;
  engagement: EngagementMetrics;
  mentionsCompany: boolean;
  isExternal?: boolean;
  externalAuthorName?: string;
  externalAuthorUrl?: string;
  externalAuthorAvatarUrl?: string;
  externalAuthorHeadline?: string;
}
