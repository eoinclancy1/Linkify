'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';

interface SidebarNavItemProps {
  href: string;
  icon: ElementType;
  label: string;
}

export default function SidebarNavItem({ href, icon: Icon, label }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors relative ${
        isActive
          ? 'text-white font-semibold'
          : 'text-neutral-400 hover:text-white'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-linkify-green rounded-r" />
      )}
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}
