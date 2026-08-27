'use client';

import { type ReactNode } from 'react';

interface SearchPageShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function SearchPageShell({ sidebar, children }: SearchPageShellProps) {
  return (
    <main id="main-content" className="page-main page-container">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {sidebar}
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
