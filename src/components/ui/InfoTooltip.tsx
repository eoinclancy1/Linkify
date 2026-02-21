'use client';

import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="relative group/info inline-flex">
      <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-elevated border border-highlight px-3 py-2 text-xs text-neutral-300 leading-relaxed opacity-0 group-hover/info:opacity-100 transition-opacity duration-150 shadow-lg z-50">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-elevated" />
      </span>
    </span>
  );
}
