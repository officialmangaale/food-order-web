'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Banknote, Edit3, Mail, MapPin, Phone, Plus, Receipt, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <ProfilePageLayout title="Profile Info">
        {isLoading ? (
          <ProfileOverviewSkeleton />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#C70F12] text-2xl font-extrabold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-extrabold text-[#1F1A1A]">{displayName}</h2>
                      <p className="mt-1 text-base font-medium text-[#5A3434]">Food Enthusiast</p>
                      <div className="mt-6 space-y-3 text-sm text-[#2B2020]">
                        {displayEmail && (
                          <p className="flex items-center gap-3">
                            <Mail className="h-5 w-5 shrink-0 text-[#8F6B65]" aria-hidden="true" />
                            <span className="min-w-0 truncate">{displayEmail}</span>
                          </p>
                        )}
                        {displayPhone && (
                          <p className="flex items-center gap-3">
                            <Phone className="h-5 w-5 shrink-0 text-[#8F6B65]" aria-hidden="true" />
                            <span>{displayPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[#A80F15] transition hover:bg-[#FFF0F0]"
                    aria-label="Edit profile"
                    title="Edit profile"
                  >
                    <Edit3 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#5A3434]">
                  Culinary Profile
                </p>
                {tags.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#A9827C] px-4 py-2 text-sm font-semibold text-[#2B2020]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl bg-[#FFF8F7] px-4 py-3 text-sm text-[#7B6B6B]">
                    Preferences will appear here after you save them.
                  </p>
                )}
                <div className="mt-8 flex gap-8">
                  <StatBlock label="Orders" value={ordersCount} />
                  <StatBlock label="Reviews" value={reviewsCount} />
                </div>
              </section>
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold text-[#1F1A1A]">Recent Orders</h2>
                <Link href="/profile/orders" className="text-sm font-bold text-[#A80F15] hover:text-[#7C0C11]">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {dashboard?.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => (
                    <div
                      key={String(order.order_id)}
                      className="flex flex-col gap-4 rounded-2xl border border-[#F0DADA] bg-white p-4 shadow-card sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#201A1A] text-sm font-extrabold text-white">
                          <Receipt className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-extrabold text-[#1F1A1A]">
                            {order.restaurant_name || 'Restaurant'}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-[#6B5B5B]">
                            {getOrderStatusLabel(order.status)} - {getOrderDate(order)}
                          </p>
                          <p className="mt-1 truncate text-sm text-[#2B2020]">{getItemSummary(order.items)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <p className="text-lg font-extrabold text-[#1F1A1A]">{formatMoney(getOrderTotal(order))}</p>
                        <Link
                          href={`/orders/${order.order_id}/track`}
                          className="rounded-xl bg-[#A80F15] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8F0D12]"
                        >
                          Track
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyPreview
                    icon={<Receipt className="h-6 w-6" aria-hidden="true" />}
                    title="No recent orders"
                    description="Your latest orders will show up here."
                  />
                )}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-[#1F1A1A]">Saved Addresses</h2>
                  <Link
                    href="/profile/addresses"
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#A80F15] hover:text-[#7C0C11]"
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboard?.addresses.length ? (
                    dashboard.addresses.map((address) => (
                      <div
                        key={String(address.id)}
                        className="rounded-2xl border border-[#F0DADA] bg-white p-4 shadow-card"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#A80F15]" aria-hidden="true" />
                          <div>
                            <p className="font-extrabold text-[#1F1A1A]">{address.label || 'Address'}</p>
                            <p className="mt-1 text-sm leading-6 text-[#4B3A3A]">
                              {address.address_line1}
                              {(address.area || address.city || address.pincode) && (
                                <>
                                  <br />
                                  {[address.area, address.city, address.pincode].filter(Boolean).join(', ')}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyPreview
                      icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
                      title="No saved addresses"
                      description="Save delivery addresses for faster checkout."
                    />
                  )}
                  <Link
                    href="/profile/addresses"
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#E7B8B3] text-sm font-bold text-[#A80F15] transition hover:bg-white"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    Add New Address
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-extrabold text-[#1F1A1A]">Payment Methods</h2>
                <div className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                      <Banknote className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1F1A1A]">Cash on Delivery available</p>
                      <p className="mt-1 text-sm text-[#6B5B5B]">Pay when your order arrives.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {editOpen && (
          <EditProfileModal
            onClose={() => setEditOpen(false)}
            profile={profile}
            fallbackName={displayName}
            fallbackPhone={displayPhone}
            fallbackEmail={displayEmail}
            token={token}
            onSaved={handleProfileSaved}
            onAuthExpired={logout}
          />
        )}
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-4xl font-extrabold leading-none text-[#A80F15]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#3B2D2D]">{label}</p>
    </div>
  );
}

function EmptyPreview({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white p-6 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
        {icon}
      </div>
      <h3 className="mt-4 font-extrabold text-[#1F1A1A]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B5B5B]">{description}</p>
    </div>
  );
}

function ProfileOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

interface EditProfileModalProps {
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
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
        aria-label="Close edit profile"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#E8DFDF] px-5 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Account</p>
            <h2 id="edit-profile-title" className="mt-1 text-xl font-extrabold text-[#1F1A1A]">
              Edit profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#4B3A3A] transition hover:bg-white hover:text-[#A80F15]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Phone" value={fallbackPhone} disabled />
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" fullWidth loading={saving} className="bg-[#A80F15] hover:bg-[#8F0D12]">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
