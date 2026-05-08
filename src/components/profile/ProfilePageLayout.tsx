'use client';

import { type ReactNode } from 'react';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';

interface ProfilePageLayoutProps {
  title: string;
  children: ReactNode;
}

export function ProfilePageLayout({ title, children }: ProfilePageLayoutProps) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FFF8F7] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <ProfileSidebar />
        <section className="min-w-0">
          <h1 className="mb-6 text-3xl font-extrabold tracking-normal text-[#1F1A1A] sm:text-4xl">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
