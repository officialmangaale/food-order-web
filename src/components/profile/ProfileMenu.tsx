'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, MapPinned, Package, Settings, User, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';

interface ProfileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileMenu({ open, onClose }: ProfileMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const displayName = user?.name || user?.phone || phone || 'Mangaale customer';

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-[125]">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/20 sm:bg-transparent"
        aria-label="Close profile menu"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] p-4 shadow-2xl sm:bottom-auto sm:left-auto sm:right-6 sm:top-24 sm:w-80 sm:rounded-3xl">
        <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Account</p>
            <h2 className="mt-1 truncate text-lg font-extrabold text-[#1F1A1A]">Hi, {displayName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4B3A3A] transition hover:bg-[#FFF0F0] hover:text-[#A80F15]"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="space-y-2">
          <ProfileLink href="/profile" icon={<User className="h-4 w-4" />} label="Profile" onClick={onClose} />
          <ProfileLink href="/profile/orders" icon={<Package className="h-4 w-4" />} label="My Orders" onClick={onClose} />
          <ProfileLink
            href="/profile/addresses"
            icon={<MapPinned className="h-4 w-4" />}
            label="Saved Addresses"
            onClick={onClose}
          />
          <ProfileLink
            href="/profile/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            onClick={onClose}
          />
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-extrabold text-red-700 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}

function ProfileLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#3B2D2D] transition hover:bg-[#FFF0F0] hover:text-[#A80F15]"
    >
      {icon}
      {label}
    </Link>
  );
}
