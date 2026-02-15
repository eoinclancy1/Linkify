export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  engagementScore: number; // likes + (comments * 2) + (shares * 3)
}
