'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, MapPin, ShoppingCart, UserCircle } from 'lucide-react';
import { useRestaurantMode } from '@/hooks/useRestaurantMode';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { SearchHeaderInput } from '@/components/search/SearchHeaderInput';
import { OtpLoginModal } from '@/components/auth/OtpLoginModal';
import { LocationModal } from '@/components/location/LocationModal';
import { ProfileMenu } from '@/components/profile/ProfileMenu';

export function AppHeader() {
  const {
    lockedMode,
    lockedRestaurantId,
    lockedRestaurantSlug,
    lockedRestaurantName,
    homeLink,
    isLockedRoute,
  } = useRestaurantMode();
  const totalItems = useCartStore((s) => s.totalItems());
  const hasMounted = useHasMounted();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const savedLocationLabel = useLocationStore((s) => s.label);
  const manualArea = useLocationStore((s) => s.manualArea);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const hasBrowserLocation =
    hasMounted && permissionStatus === 'granted' && latitude != null && longitude != null;
  const locationLabel =
    hasMounted
      ? savedLocationLabel || manualArea || (hasBrowserLocation ? 'Current location' : 'Select location')
      : 'Select location';
  const isLocationPlaceholder = !hasMounted || (!savedLocationLabel && !manualArea && !hasBrowserLocation);
  const displayTotalItems = hasMounted ? totalItems : 0;
  const isRestaurantDetailHeader =
    /^\/restaurants\/[^/]+/.test(pathname) || pathname.startsWith('/r/');
  const searchPlaceholder =
    isRestaurantDetailHeader
      ? isLockedRoute
        ? 'Search this menu'
        : 'Search in Mangaale...'
      : lockedMode && lockedRestaurantName
      ? 'Search this menu'
      : 'Search for restaurants, cuisine, or a dish';
  const logoHref = isRestaurantDetailHeader && isLockedRoute ? pathname : homeLink;

  const handleLocationClick = () => {
    setLocationOpen(true);
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setProfileOpen((open) => !open);
      return;
    }

    setLoginOpen(true);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedQuery = searchQuery.trim();

    if (isRestaurantDetailHeader) {
      window.dispatchEvent(
        new CustomEvent('mangaale:menu-search', {
          detail: { query: trimmedQuery },
        })
      );
      document.getElementById('restaurant-menu')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    if (lockedMode) {
      params.set('locked', 'true');
      if (lockedRestaurantId) params.set('restaurant_id', String(lockedRestaurantId));
      if (lockedRestaurantSlug) params.set('restaurant', lockedRestaurantSlug);
      if (lockedRestaurantName) params.set('restaurant_name', lockedRestaurantName);
    }

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    }

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <>
      <header
        className={`safe-top top-0 z-50 transition-shadow ${
          isRestaurantDetailHeader
            ? 'restaurant-detail-header pointer-events-none fixed inset-x-0 h-[72px] border-transparent bg-transparent lg:sticky'
            : 'sticky border-b border-[#E8DFDF] bg-[#FCF7F7]/95 backdrop-blur-xl'
        }`}
      >
        {isRestaurantDetailHeader ? (
          <>
            <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-4 px-3 py-3 sm:px-6 lg:px-7">
              <Link
                href={logoHref}
                aria-label={isLockedRoute || lockedMode ? 'Back to restaurant home' : 'Mangaale home'}
                className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#172033] shadow-sm backdrop-blur-sm lg:hidden"
              >
                <ArrowLeft className="h-6 w-6" aria-hidden="true" />
              </Link>
              <div className="hidden lg:block">
                <HeaderLogo href={logoHref} isLockedRoute={isLockedRoute || lockedMode} />
              </div>
              <SearchHeaderInput
                value={searchQuery}
                placeholder={searchPlaceholder}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                onClear={() => setSearchQuery('')}
                className="pointer-events-auto mx-auto hidden max-w-[520px] lg:block"
              />
              <HeaderActions totalItems={displayTotalItems} onAccountClick={handleAccountClick} className="pointer-events-auto ml-auto hidden lg:flex" />
            </div>
          </>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-5 lg:px-8 lg:py-[18px]">
            <div className="flex items-center justify-between gap-4 lg:shrink-0 lg:justify-start">
              <HeaderLogo href={homeLink} isLockedRoute={isLockedRoute || lockedMode} />
              <HeaderActions totalItems={displayTotalItems} onAccountClick={handleAccountClick} className="flex lg:hidden" />
            </div>

            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-3 lg:flex-1 lg:gap-5">
              <HeaderLocationPill
                label={locationLabel}
                isPlaceholder={isLocationPlaceholder}
                onClick={handleLocationClick}
              />
              <SearchHeaderInput
                value={searchQuery}
                placeholder={searchPlaceholder}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                onClear={() => setSearchQuery('')}
              />
            </div>

            <HeaderActions totalItems={displayTotalItems} onAccountClick={handleAccountClick} className="hidden lg:flex" />
          </div>
        )}
      </header>
      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <OtpLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onVerified={() => setProfileOpen(true)}
      />
      <ProfileMenu open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

interface HeaderLogoProps {
  href: string;
  isLockedRoute: boolean;
}

function HeaderLogo({ href, isLockedRoute }: HeaderLogoProps) {
  return (
    <Link
      href={href}
      aria-label={isLockedRoute ? 'Back to restaurant home' : 'Mangaale home'}
      className="flex shrink-0 items-center"
    >
      <span className="text-[28px] font-extrabold leading-none tracking-normal text-[#A80F15] sm:text-[32px] lg:text-[34px]">
        Mangaale
      </span>
    </Link>
  );
}

interface HeaderLocationPillProps {
  label: string;
  isPlaceholder: boolean;
  onClick: () => void;
}

function HeaderLocationPill({ label, isPlaceholder, onClick }: HeaderLocationPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-11 w-full min-w-0 items-center gap-2 rounded-full border border-[#E9CBCB] bg-[#FFFDFD] px-4 text-left shadow-[0_1px_0_rgba(179,19,23,0.03)] transition hover:border-[#D99A9A] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B31317]/10 md:h-12 md:w-[230px] md:flex-none lg:w-[220px] xl:w-[240px]"
      aria-label="Choose delivery location"
    >
      <MapPin className="h-4 w-4 shrink-0 text-[#A80F15]" aria-hidden="true" />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${
          isPlaceholder ? 'text-[#7B6B6B]' : 'text-[#302727]'
        }`}
      >
        {label}
      </span>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-[#7B6B6B] transition group-hover:text-[#A80F15]"
        aria-hidden="true"
      />
    </button>
  );
}

interface HeaderActionsProps {
  totalItems: number;
  onAccountClick: () => void;
  className?: string;
}

function HeaderActions({ totalItems, onAccountClick, className = '' }: HeaderActionsProps) {
  return (
    <div className={`shrink-0 items-center gap-2 ${className}`}>
      <Link
        href="/cart"
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#2B2020] transition hover:bg-white hover:text-[#A80F15] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B31317]/10"
        aria-label="Cart"
      >
        <ShoppingCart className="h-[21px] w-[21px]" aria-hidden="true" />
        {totalItems > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#A80F15] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#FCF7F7]">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={onAccountClick}
        className="flex h-11 w-11 items-center justify-center rounded-full text-[#2B2020] transition hover:bg-white hover:text-[#A80F15] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B31317]/10"
        aria-label="Account"
        title="Account"
      >
        <UserCircle className="h-[22px] w-[22px]" aria-hidden="true" />
      </button>
    </div>
  );
}
