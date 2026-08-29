'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, House, Store, UserRound } from 'lucide-react';
import { features } from '@/config/features';

const items = [
  /* Browsing the menu by category is part of Explore, so the tab stays lit
     while the user is on a category screen. */
  { href: '/restaurants', label: 'Explore', icon: Store, alsoActiveFor: ['/categories'] },
  { href: '/', label: 'Home', icon: House },
  ...(features.loyaltyUI ? [{ href: '/rewards', label: 'Rewards', icon: Coins }] : []),
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const visible =
    pathname === '/' ||
    pathname === '/restaurants' ||
    pathname === '/trending' ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/profile');

  if (!visible) return null;

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[600px] rounded-sheet border border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-floating backdrop-blur-xl md:hidden"
      >
        <ul className={`grid items-end ${items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {items.map(({ href, label, icon: Icon, alsoActiveFor }) => {
            const active =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href) ||
                  (alsoActiveFor?.some((prefix) => pathname.startsWith(prefix)) ?? false);
            const isHome = href === '/';

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`mx-auto flex min-h-11 w-fit min-w-16 flex-col items-center gap-1 rounded-control text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${
                    active ? 'text-brand-900' : 'text-ink-muted hover:text-brand-900'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-full transition-colors ${
                      isHome && active
                        ? '-mt-4 h-12 w-12 border-4 border-surface bg-brand-700 text-white shadow-brand'
                        : `h-9 w-11 ${active ? 'bg-brand-50' : ''}`
                    }`}
                  >
                    <Icon
                      className={isHome && active ? 'h-[22px] w-[22px] fill-current' : 'h-5 w-5'}
                      aria-hidden="true"
                    />
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
