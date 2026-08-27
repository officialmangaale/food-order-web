'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Edit3, Mail, MapPin, Phone, Plus, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/layout/PageHeader';
import { Sheet } from '@/components/ui/Sheet';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { ProfilePageLayout } from '@/components/profile/ProfilePageLayout';
import { ProfileRouteGuard } from '@/components/profile/ProfileRouteGuard';
import {
  getInitials,
  getItemSummary,
  getOrderDate,
  getOrderStatusLabel,
  getOrderTotal,
  getPreferenceTags,
  getProfileName,
  getProfilePhone,
} from '@/components/profile/profileUtils';
import { getErrorMessage, isAuthError } from '@/services/http';
import { getProfileDashboard, updateMe, type CustomerProfile } from '@/services/profileApi';
import { useAuthStore } from '@/store/authStore';
import { formatMoney } from '@/utils/money';
import { getOrderStatusBadgeVariant } from '@/utils/orderStatus';

export function ProfileOverview() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [editOpen, setEditOpen] = useState(false);

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-dashboard', token],
    queryFn: () => getProfileDashboard(token as string),
    enabled: Boolean(isAuthenticated && token),
    retry: (failureCount, err) => !isAuthError(err) && failureCount < 1,
  });

  useEffect(() => {
    if (error && isAuthError(error)) logout();
  }, [error, logout]);

  const profile = dashboard?.profile ?? null;
  const displayName = getProfileName(profile, user, phone);
  const displayPhone = getProfilePhone(profile, user, phone);
  const displayEmail = profile?.email || user?.email;
  const initials = getInitials(displayName);
  const tags = useMemo(() => getPreferenceTags(profile), [profile]);
  const ordersCount = dashboard?.ordersCount ?? 0;
  const reviewsCount = dashboard?.reviewsCount ?? 0;

  const handleProfileSaved = (updatedProfile: CustomerProfile) => {
    if (token) {
      setAuth(token, {
        ...user,
        ...updatedProfile,
        phone: updatedProfile.phone || user?.phone || phone || '',
      });
    }
    void refetch();
  };

  return (
    <ProfileRouteGuard>
      <ProfilePageLayout title="Profile">
        {isLoading ? (
          <ProfileOverviewSkeleton />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
              <Card as="section">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xl font-extrabold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-section text-ink">{displayName}</h2>
                      <div className="mt-3 space-y-2 text-sm">
                        {displayEmail && (
                          <p className="flex items-center gap-2.5 text-ink-muted">
                            <Mail className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                            <span className="min-w-0 truncate">{displayEmail}</span>
                          </p>
                        )}
                        {displayPhone && (
                          <p className="flex items-center gap-2.5 text-ink-muted">
                            <Phone className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                            <span>{displayPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => setEditOpen(true)}
                    aria-label="Edit profile"
                    title="Edit profile"
                  >
                    <Edit3 className="h-[18px] w-[18px]" aria-hidden="true" />
                  </Button>
                </div>
              </Card>

              <Card as="section">
                <p className="text-eyebrow uppercase text-ink-subtle">Your preferences</p>
                {tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="brand">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-control bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
                    Preferences will appear here after you save them.
                  </p>
                )}
                <div className="mt-6 flex gap-8">
                  <StatBlock label="Orders" value={ordersCount} />
                  <StatBlock label="Reviews" value={reviewsCount} />
                </div>
              </Card>
            </div>

            <section>
              <SectionHeader title="Recent orders" href="/profile/orders" linkLabel="View all" />
              <div className="space-y-3">
                {dashboard?.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => (
                    <Card key={String(order.order_id)} as="article">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
                            <Receipt className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-extrabold text-ink sm:text-base">
                              {order.restaurant_name || 'Restaurant'}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant={getOrderStatusBadgeVariant(order.status)} size="sm" dot>
                                {getOrderStatusLabel(order.status)}
                              </Badge>
                              <span className="text-xs text-ink-subtle">{getOrderDate(order)}</span>
                            </div>
                            <p className="mt-1 truncate text-sm text-ink-muted">
                              {getItemSummary(order.items)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                          <p className="font-extrabold text-ink">
                            {formatMoney(getOrderTotal(order))}
                          </p>
                          <ButtonLink
                            href={`/orders/${order.order_id}/track`}
                            variant="outline"
                            size="sm"
                          >
                            Track
                          </ButtonLink>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    icon="receipt"
                    title="No recent orders"
                    description="Your latest orders will show up here."
                  />
                )}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section>
                <SectionHeader title="Saved addresses" href="/profile/addresses" linkLabel="Manage" />
                <div className="space-y-3">
                  {dashboard?.addresses.length ? (
                    dashboard.addresses.map((address) => (
                      <Card key={String(address.id)}>
                        <div className="flex items-start gap-3">
                          <MapPin
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand-800"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-ink">
                              {address.label || 'Address'}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-ink-muted">
                              {address.address_line1}
                              {(address.area || address.city || address.pincode) && (
                                <>
                                  <br />
                                  {[address.area, address.city, address.pincode]
                                    .filter(Boolean)
                                    .join(', ')}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      icon="location"
                      title="No saved addresses"
                      description="Save delivery addresses for faster checkout."
                    />
                  )}
                  <Link
                    href="/profile/addresses"
                    className="flex min-h-14 items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-sm font-bold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add new address
                  </Link>
                </div>
              </section>

              <section>
                <SectionHeader title="Payment" />
                <Card>
                  <CardHeader
                    title="Cash on delivery"
                    description="Pay when your order arrives."
                    icon={<Banknote className="h-5 w-5" aria-hidden="true" />}
                  />
                </Card>
              </section>
            </div>
          </div>
        )}

        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          fallbackName={displayName}
          fallbackPhone={displayPhone}
          fallbackEmail={displayEmail}
          token={token}
          onSaved={handleProfileSaved}
          onAuthExpired={logout}
        />
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-title text-brand-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-muted">{label}</p>
    </div>
  );
}

function ProfileOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-2">
        <PanelSkeleton className="h-52" />
        <PanelSkeleton className="h-52" />
      </div>
      <PanelSkeleton className="h-36" />
      <div className="grid gap-5 xl:grid-cols-2">
        <PanelSkeleton className="h-40" />
        <PanelSkeleton className="h-40" />
      </div>
    </div>
  );
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  fallbackName: string;
  fallbackPhone: string;
  fallbackEmail?: string;
  token: string | null;
  onSaved: (profile: CustomerProfile) => void;
  onAuthExpired: () => void;
}

function EditProfileModal({
  open,
  onClose,
  profile,
  fallbackName,
  fallbackPhone,
  fallbackEmail,
  token,
  onSaved,
  onAuthExpired,
}: EditProfileModalProps) {
  const [name, setName] = useState(profile?.name || fallbackName);
  const [email, setEmail] = useState(profile?.email || fallbackEmail || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed the form each time the sheet opens so it reflects the latest
  // profile. Adjusted during render rather than in an effect to avoid a
  // second render pass.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(profile?.name || fallbackName);
      setEmail(profile?.email || fallbackEmail || '');
      setError('');
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');

    try {
      const updated = await updateMe(token, { name: name.trim(), email: email.trim() || undefined });
      onSaved(updated);
      onClose();
    } catch (err) {
      if (isAuthError(err)) {
        onAuthExpired();
        onClose();
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          data-dialog-initial-focus
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input label="Phone" value={fallbackPhone} disabled hint="Phone numbers cannot be changed here." />
        {error && (
          <p
            role="alert"
            className="rounded-control bg-danger-tint px-3 py-2 text-sm font-semibold text-danger"
          >
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={saving}>
          Save changes
        </Button>
      </form>
    </Sheet>
  );
}
