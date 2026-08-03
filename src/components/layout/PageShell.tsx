'use client';

import { type ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageShell({ children, className = '', noPadding }: PageShellProps) {
  return (
    <main className={`mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[var(--content-max-width)] ${noPadding ? '' : 'px-[var(--page-gutter)] py-6 lg:py-8'} pb-28 ${className}`}>
      {children}
    </main>
  );
}
