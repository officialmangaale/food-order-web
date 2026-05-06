'use client';

import { type ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageShell({ children, className = '', noPadding }: PageShellProps) {
  return (
    <main className={`max-w-3xl mx-auto min-h-[calc(100vh-3.5rem)] ${noPadding ? '' : 'px-4 py-4'} pb-24 ${className}`}>
      {children}
    </main>
  );
}
