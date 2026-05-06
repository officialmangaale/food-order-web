'use client';

import Link from 'next/link';
import { ShoppingBag, Search, MapPin, User } from 'lucide-react';
import { useRestaurantMode } from '@/hooks/useRestaurantMode';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export function AppHeader() {
  const { lockedMode, lockedRestaurantName, homeLink, isLockedRoute } = useRestaurantMode();
  const totalItems = useCartStore((s) => s.totalItems());
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo / Brand */}
        <Link href={homeLink} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cherry-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div className="hidden sm:block">
            {isLockedRoute && lockedRestaurantName ? (
              <div>
                <p className="text-xs text-gray-500 leading-none">Ordering from</p>
                <p className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[180px]">
                  {lockedRestaurantName}
                </p>
              </div>
            ) : (
              <span className="text-lg font-bold text-cherry-600">Mangaale</span>
            )}
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!lockedMode && (
            <Link
              href="/search"
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          {lockedMode && (
            <Link
              href={`/search?restaurant=${lockedRestaurantName ?? ''}`}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Search menu"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          {!lockedMode && (
            <button
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Location"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}

          <Link
            href="/cart"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-cherry-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {isAuth && (
            <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600" aria-label="Account">
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
