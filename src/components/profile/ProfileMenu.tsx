'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, MapPinned, Package, Settings, User } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
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

  const displayName = user?.name || user?.phone || phone || 'there';

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Hi, ${displayName}`} size="sm">
      <nav aria-label="Account" className="space-y-1">
        <ProfileLink
          href="/profile"
          icon={<User className="h-[18px] w-[18px]" />}
          label="Profile info"
          onClick={onClose}
        />
        <ProfileLink
          href="/profile/orders"
          icon={<Package className="h-[18px] w-[18px]" />}
          label="Your orders"
          onClick={onClose}
        />
        <ProfileLink
          href="/profile/addresses"
          icon={<MapPinned className="h-[18px] w-[18px]" />}
          label="Saved addresses"
          onClick={onClose}
        />
        <ProfileLink
          href="/profile/settings"
          icon={<Settings className="h-[18px] w-[18px]" />}
          label="Settings"
          onClick={onClose}
        />

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-control border-t border-line px-4 pt-3 text-left text-sm font-bold text-danger transition-colors hover:bg-danger-tint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          Log out
        </button>
      </nav>
    </Sheet>
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
      className="flex min-h-12 items-center gap-3 rounded-control px-4 text-sm font-bold text-ink transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
    >
      <span className="shrink-0 text-ink-muted" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  );
}
