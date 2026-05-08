'use client';

import { useState, type ReactNode } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { OtpLoginModal } from '@/components/auth/OtpLoginModal';
import { Button } from '@/components/ui/Button';
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
      <main className="min-h-[calc(100vh-5rem)] bg-[#FFF8F7] px-4 py-12">
        <div className="mx-auto flex min-h-[52vh] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-[#F0DADA] bg-white p-6 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-[#1F1A1A]">Login to continue</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B5B5B]">
              Please verify your phone number to view your profile.
            </p>
            <Button className="mt-6 bg-[#A80F15] hover:bg-[#8F0D12]" onClick={() => setLoginOpen(true)}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login with OTP
            </Button>
          </div>
        </div>
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
