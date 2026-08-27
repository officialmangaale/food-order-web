'use client';

import { useState, type ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { OtpLoginModal } from '@/components/auth/OtpLoginModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/authStore';

interface ProfileRouteGuardProps {
  children: ReactNode;
}

export function ProfileRouteGuard({ children }: ProfileRouteGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const [loginOpen, setLoginOpen] = useState(false);

  if (!isAuthenticated || !token) {
    return (
      <main id="main-content" className="page-main page-container">
        <PageHeader eyebrow="Account" title="Your profile" backHref="/" />
        <EmptyState
          icon="order"
          title="Log in to continue"
          description="Verify your phone number to view your orders, addresses and profile."
        >
          <Button variant="primary" size="md" onClick={() => setLoginOpen(true)}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Log in
          </Button>
        </EmptyState>
        <OtpLoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onVerified={() => setLoginOpen(false)}
        />
      </main>
    );
  }

  return <>{children}</>;
}
