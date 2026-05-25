'use client';

import { type ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageShell({ children, className = '', noPadding }: PageShellProps) {
  return (
    <main className={`max-w-5xl mx-auto min-h-[calc(100vh-3.5rem)] ${noPadding ? '' : 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8'} pb-28 ${className}`}>
      {children}
    </main>
  );
}
