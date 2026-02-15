import { EngagementMetrics } from './engagement';

export type PostType = 'original' | 'reshare' | 'article' | 'poll';

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  textContent: string;
  publishedAt: string; // ISO date string
  url: string;
  engagement: EngagementMetrics;
  mentionsCompany: boolean;
}
