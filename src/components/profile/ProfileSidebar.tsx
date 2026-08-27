'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, MapPinned, Package, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const sidebarItems = [
  { href: '/profile', label: 'Profile info', icon: User },
  { href: '/profile/orders', label: 'Orders', icon: Package },
  { href: '/profile/addresses', label: 'Addresses', icon: MapPinned },
  { href: '/profile/settings', label: 'Settings', icon: Settings },
];

export function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
      {/* Horizontal tab strip on mobile, vertical nav on desktop. */}
      <nav
        aria-label="Profile sections"
        className="hide-scrollbar snap-row gutter-bleed flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:px-0 lg:block lg:space-y-1 lg:overflow-visible"
      >
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/profile' ? pathname === '/profile' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 lg:w-full lg:rounded-control ${
                active
                  ? 'bg-brand-50 text-brand-900'
                  : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-bold text-danger transition-colors hover:bg-danger-tint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 lg:mt-3 lg:w-full lg:rounded-control lg:border-t lg:border-line lg:pt-3"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">Log out</span>
        </button>
      </nav>
    </aside>
  );
}
