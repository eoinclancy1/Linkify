import { create } from 'zustand';

interface AppState {
  timeRange: 7 | 14 | 30;
  setTimeRange: (range: 7 | 14 | 30) => void;
  leaderboardSort: 'engagement' | 'likes' | 'comments' | 'shares' | 'recent';
  setLeaderboardSort: (sort: 'engagement' | 'likes' | 'comments' | 'shares' | 'recent') => void;
  employeeSort: 'streak' | 'posts' | 'name' | 'recent';
  setEmployeeSort: (sort: 'streak' | 'posts' | 'name' | 'recent') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  employeeTab: 'overview' | 'leaderboard' | 'posts';
  setEmployeeTab: (tab: 'overview' | 'leaderboard' | 'posts') => void;
  contentEngTab: 'overview' | 'leaderboard' | 'posts';
  setContentEngTab: (tab: 'overview' | 'leaderboard' | 'posts') => void;
  advisorTab: 'overview' | 'leaderboard' | 'posts';
  setAdvisorTab: (tab: 'overview' | 'leaderboard' | 'posts') => void;
  leaderboardAuthorFilter: 'all' | 'employees' | 'community';
  setLeaderboardAuthorFilter: (filter: 'all' | 'employees' | 'community') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  timeRange: 30,
  setTimeRange: (range) => set({ timeRange: range }),
  leaderboardSort: 'engagement',
  setLeaderboardSort: (sort) => set({ leaderboardSort: sort }),
  employeeSort: 'streak',
  setEmployeeSort: (sort) => set({ employeeSort: sort }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  employeeTab: 'overview',
  setEmployeeTab: (tab) => set({ employeeTab: tab }),
  contentEngTab: 'overview',
  setContentEngTab: (tab) => set({ contentEngTab: tab }),
  advisorTab: 'overview',
  setAdvisorTab: (tab) => set({ advisorTab: tab }),
  leaderboardAuthorFilter: 'all',
  setLeaderboardAuthorFilter: (filter) => set({ leaderboardAuthorFilter: filter }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
