'use client';

import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMenuToggle?: () => void;
}

export default function TopBar({ title, onMenuToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-sm border-b border-highlight">
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden text-neutral-400 hover:text-white"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold text-white">{title}</h1>
    </header>
  );
}
