'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Phone, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
          <Card as="section">
            <CardHeader
              title={displayName}
              description={displayPhone || undefined}
              icon={<User className="h-5 w-5" aria-hidden="true" />}
            />
            {displayPhone && (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {displayPhone}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card tone="sunken" className="shadow-none">
                <ShieldCheck className="h-5 w-5 text-brand-800" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-extrabold text-ink">Secure OTP login</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Your account is verified by phone number.
                </p>
              </Card>
              <Card tone="sunken" className="shadow-none">
                <Bell className="h-5 w-5 text-ink-subtle" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-extrabold text-ink">Notifications</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">Coming soon.</p>
              </Card>
            </div>
          </Card>

          <Card as="aside">
            <h2 className="text-base font-extrabold text-ink sm:text-lg">Session</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Sign out on this device and return to the home page.
            </p>
            <Button variant="danger" fullWidth className="mt-5" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </Card>
        </div>
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}
