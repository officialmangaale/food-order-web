'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Phone, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProfilePageLayout } from '@/components/profile/ProfilePageLayout';
import { ProfileRouteGuard } from '@/components/profile/ProfileRouteGuard';
import { getProfileName, getProfilePhone } from '@/components/profile/profileUtils';
import { useAuthStore } from '@/store/authStore';

export function ProfileSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const logout = useAuthStore((s) => s.logout);
  const displayName = getProfileName(null, user, phone);
  const displayPhone = getProfilePhone(null, user, phone);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ProfileRouteGuard>
      <ProfilePageLayout title="Settings">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
                <User className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Account</p>
                <h2 className="mt-2 truncate text-2xl font-extrabold text-[#1F1A1A]">{displayName}</h2>
                {displayPhone && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6B5B5B]">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {displayPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#F0DADA] bg-[#FFF8F7] p-4">
                <ShieldCheck className="h-5 w-5 text-[#A80F15]" aria-hidden="true" />
                <h3 className="mt-3 font-extrabold text-[#1F1A1A]">Secure OTP login</h3>
                <p className="mt-1 text-sm leading-6 text-[#6B5B5B]">Your account is verified by phone number.</p>
              </div>
              <div className="rounded-2xl border border-[#F0DADA] bg-[#FFF8F7] p-4">
                <Bell className="h-5 w-5 text-[#A80F15]" aria-hidden="true" />
                <h3 className="mt-3 font-extrabold text-[#1F1A1A]">Notification preferences</h3>
                <p className="mt-1 text-sm leading-6 text-[#6B5B5B]">Coming soon.</p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card">
            <h2 className="text-xl font-extrabold text-[#1F1A1A]">Session</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B5B5B]">
              Sign out on this device and return to the home page.
            </p>
            <Button variant="danger" className="mt-5 w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </aside>
        </div>
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}
