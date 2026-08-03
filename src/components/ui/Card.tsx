'use client';

import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', padding = true, onClick }: CardProps) {
  return (
    <div
      className={`rounded-card border border-line bg-surface shadow-card ${padding ? 'p-4 sm:p-5' : ''} ${onClick ? 'card-hover cursor-pointer hover:border-line-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
