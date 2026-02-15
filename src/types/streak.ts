export interface PostingStreak {
  employeeId: string;
  currentStreak: number;
  longestStreak: number;
  streakUnit: 'week';
  lastPostDate: string;
  isActive: boolean;
}

export interface PostingActivity {
  employeeId: string;
  date: string;
  postCount: number;
}
