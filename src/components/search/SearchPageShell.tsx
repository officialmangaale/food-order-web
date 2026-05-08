'use client';

import { type ReactNode } from 'react';

interface SearchPageShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function SearchPageShell({ sidebar, children }: SearchPageShellProps) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FFF7F5] pb-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        {sidebar}
        <section className="min-w-0 flex-1">{children}</section>
      </div>

      <footer className="border-t border-[#E8DFDF] bg-[#FCF7F7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-[#6B5B5B] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-lg font-extrabold text-[#1F1A1A]">Mangaale</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Help Center</span>
          </div>
          <p>(c) 2026 Mangaale. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
