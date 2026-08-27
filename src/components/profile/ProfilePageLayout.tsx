'use client';

import { type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';

interface ProfilePageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Profile shares the app's page frame — same container width, gutters and
 * header treatment as every other route — so it does not read as a separate
 * product.
 */
export function ProfilePageLayout({ title, description, children }: ProfilePageLayoutProps) {
  return (
    <main id="main-content" className="page-main page-container">
      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
        <ProfileSidebar />
        <section className="min-w-0">
          <PageHeader eyebrow="Account" title={title} meta={description} />
          {children}
        </section>
      </div>
    </main>
  );
}
