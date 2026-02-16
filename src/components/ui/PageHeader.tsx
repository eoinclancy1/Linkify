import React from 'react';

interface PageHeaderProps {
  title: string;
  accentLabel: string;
  icon: React.ElementType;
  statValue?: string | number;
  statLabel?: string;
}

export default function PageHeader({ title, accentLabel, icon: Icon, statValue, statLabel }: PageHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-[#0a2e1a] via-[#0d3b20] to-[#14532d] rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#4ade80]/8 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#22c55e]/6 rounded-full blur-3xl" />

      <div className="relative z-10 pt-5 pb-1 px-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4ade80] mb-1">{accentLabel}</p>
          <h1 className="text-3xl font-extrabold text-white">{title}</h1>
        </div>
        {statValue !== undefined && (
          <div className="flex items-center gap-2 text-neutral-300 pb-1">
            <Icon className="w-5 h-5 text-[#4ade80]" />
            <span className="text-2xl font-bold text-white">{statValue}</span>
            {statLabel && <span className="text-sm text-neutral-400">{statLabel}</span>}
          </div>
        )}
      </div>

      <div className="h-4 bg-gradient-to-b from-transparent to-[#121212]" />
    </div>
  );
}
