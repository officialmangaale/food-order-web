'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Store, UserRound } from 'lucide-react';

const items = [
  { href: '/restaurants', label: 'Explore', icon: Store },
  { href: '/', label: 'Home', icon: House },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const visible =
    pathname === '/' ||
    pathname === '/restaurants' ||
    pathname === '/trending' ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/profile');

  if (!visible) return null;

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-4 bottom-3 z-50 mx-auto max-w-[600px] rounded-[28px] border border-line bg-surface/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-floating backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-3 items-end">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const isHome = href === '/';

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`mx-auto flex w-fit min-w-[72px] flex-col items-center gap-1 text-xs font-bold transition ${
                    active ? 'text-brand-900' : 'text-ink-muted hover:text-brand-900'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-full transition ${
                      isHome
                        ? '-mt-6 h-14 w-14 border-4 border-white bg-brand-500 text-white shadow-brand'
                        : 'h-9 w-12'
                    }`}
                  >
                    <Icon className={isHome ? 'h-6 w-6 fill-current' : 'h-[22px] w-[22px]'} aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
