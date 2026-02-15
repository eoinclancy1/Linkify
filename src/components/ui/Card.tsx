'use client';

import { type ReactNode } from 'react';

type CardVariant = 'default' | 'interactive' | 'highlighted';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface rounded-lg p-4',
  interactive: 'bg-surface rounded-lg p-4 hover:bg-elevated transition-colors cursor-pointer',
  highlighted: 'bg-surface rounded-lg p-4 border-l-4 border-linkify-green',
};

export default function Card({ variant = 'default', className = '', children, onClick }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
