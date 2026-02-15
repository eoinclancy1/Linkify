import type { PostingActivity } from '@/types';
import { getStartOfWeek } from '@/lib/utils/date';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  lastPostDate: string;
}

/**
 * Compute posting streaks from an array of posting activities.
 * A streak is measured in consecutive weeks that contain at least one post.
 * The current streak is "active" if the most recent post week is the current
 * week or the immediately preceding week.
 */
export function computeStreaks(activities: PostingActivity[]): StreakResult {
  if (activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActive: false,
      lastPostDate: '',
    };
  }

  // Get unique week start dates from all activities that have at least one post
  const weekSet = new Set<string>();
  let latestDate = '';

  for (const activity of activities) {
    if (activity.postCount > 0) {
      const weekStart = getStartOfWeek(activity.date).toISOString().slice(0, 10);
      weekSet.add(weekStart);
      if (activity.date > latestDate) {
        latestDate = activity.date;
      }
    }
  }

  if (weekSet.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActive: false,
      lastPostDate: '',
    };
  }

  // Sort weeks chronologically
  const sortedWeeks = Array.from(weekSet).sort();

  // Compute consecutive week streaks
  let longestStreak = 1;
  let currentRun = 1;
  const streakRuns: { length: number; endWeek: string }[] = [];

  for (let i = 1; i < sortedWeeks.length; i++) {
    const prevWeek = new Date(sortedWeeks[i - 1]);
    const currWeek = new Date(sortedWeeks[i]);
    const diffDays = (currWeek.getTime() - prevWeek.getTime()) / (1000 * 60 * 60 * 24);

    if (Math.abs(diffDays - 7) < 1) {
      // Consecutive weeks
      currentRun++;
    } else {
      streakRuns.push({ length: currentRun, endWeek: sortedWeeks[i - 1] });
      currentRun = 1;
    }

    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // Push the final run
  streakRuns.push({ length: currentRun, endWeek: sortedWeeks[sortedWeeks.length - 1] });
  if (currentRun > longestStreak) {
    longestStreak = currentRun;
  }

  // Determine if the last run is the "current" streak
  const lastRun = streakRuns[streakRuns.length - 1];
  const lastWeekStart = new Date(lastRun.endWeek);
  const nowWeekStart = getStartOfWeek(new Date());
  const diffToNow = (nowWeekStart.getTime() - lastWeekStart.getTime()) / (1000 * 60 * 60 * 24);

  // Active if the last posting week is the current week or the previous week
  const isActive = diffToNow <= 7;

  return {
    currentStreak: isActive ? lastRun.length : 0,
    longestStreak,
    isActive,
    lastPostDate: latestDate,
  };
}
