/**
 * Calculate engagement score using the weighted formula:
 * likes + (comments * 2) + (shares * 3)
 */
export function calculateEngagementScore(
  likes: number,
  comments: number,
  shares: number
): number {
  return likes + comments * 2 + shares * 3;
}
