'use client';

import { useState } from 'react';
import { Home, TrendingUp, Users, Settings, Link as LinkIcon, X, Flame, FlaskConical } from 'lucide-react';
import SidebarNavItem from '@/components/layout/SidebarNavItem';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/leaderboard', icon: TrendingUp, label: "What's Trending" },
  { href: '/hits', icon: Flame, label: 'All Time Hits' },
  { href: '/employees', icon: Users, label: 'Employees' },
  { href: '/content-engineering', icon: FlaskConical, label: 'Content Engineering' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-black border-r border-highlight z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative w-64 h-full flex flex-col bg-black border-r border-highlight">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent() {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <LinkIcon size={24} className="text-linkify-green" />
        <span className="text-linkify-green font-bold text-xl">Linkify</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>
    </>
  );
}
