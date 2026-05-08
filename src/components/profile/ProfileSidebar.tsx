'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, MapPinned, Package, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const sidebarItems = [
  { href: '/profile', label: 'Profile Info', icon: User },
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
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <nav
        aria-label="Profile sections"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-[#F0DADA] bg-white/75 p-2 shadow-card lg:block lg:space-y-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      >
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/profile' ? pathname === '/profile' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full ${
                active
                  ? 'bg-[#F8D6D2] text-[#A80F15]'
                  : 'text-[#2B2020] hover:bg-white hover:text-[#A80F15]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="hidden border-t border-[#E8CACA] pt-3 lg:mt-3 lg:block" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#A80F15] transition hover:bg-white lg:w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
