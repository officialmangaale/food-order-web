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
  const currentUser = useAuthStore((s) => s.user);
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
  const locationLabel = hasMounted
    ? savedLocationLabel || manualArea || (hasBrowserLocation ? 'Current location' : 'Select location')
    : 'Select location';
  const isLocationPlaceholder =
    !hasMounted || (!savedLocationLabel && !manualArea && !hasBrowserLocation);
  const displayTotalItems = hasMounted ? totalItems : 0;
  const isRestaurantDetailHeader =
    /^\/restaurants\/[^/]+/.test(pathname) || pathname.startsWith('/r/');
  const isHomePage = pathname === '/';
  const firstName = currentUser?.name?.trim().split(/\s+/)[0];
  const searchPlaceholder = isRestaurantDetailHeader
    ? isLockedRoute
      ? 'Search this menu'
      : 'Search in Mangaale...'
    : isHomePage
      ? 'Search dishes or restaurants...'
      : lockedMode && lockedRestaurantName
        ? 'Search this menu'
        : 'Search for restaurants, cuisine, or a dish';
  const logoHref = isRestaurantDetailHeader && isLockedRoute ? pathname : homeLink;

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

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setProfileOpen((open) => !open);
      return;
    }
    setLoginOpen(true);
  };

  const searchProps = {
    value: searchQuery,
    placeholder: searchPlaceholder,
    onChange: setSearchQuery,
    onSubmit: handleSearchSubmit,
    onClear: () => setSearchQuery(''),
  };

  return (
    <>
      <header
        className={`safe-top z-50 ${
          isRestaurantDetailHeader
            ? 'restaurant-detail-header pointer-events-none sticky top-0 border-b border-transparent'
            : isHomePage
              ? 'home-hero-header relative'
              : 'sticky top-0 border-b border-line bg-canvas/90 backdrop-blur-xl'
        }`}
      >
        {/* Restaurant detail: a slim, mostly-transparent bar over the hero image. */}
        {isRestaurantDetailHeader ? (
          <div className="page-container flex min-h-[72px] items-center gap-4">
            <Link
              href={logoHref}
              aria-label={isLockedRoute || lockedMode ? 'Back to restaurant home' : 'Mangaale home'}
              className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div className="pointer-events-auto hidden lg:block">
              <HeaderLogo href={logoHref} isLockedRoute={isLockedRoute || lockedMode} />
            </div>
            <SearchHeaderInput
              {...searchProps}
              className="pointer-events-auto mx-auto hidden max-w-[520px] lg:block"
            />
            <HeaderActions
              totalItems={displayTotalItems}
              onAccountClick={handleAccountClick}
              className="pointer-events-auto ml-auto hidden lg:flex"
            />
          </div>
        ) : (
          <div className="page-container">
            {/* Mobile: brand + actions, then greeting, then search. */}
            <div
              className={
                isHomePage
                  ? 'flex min-h-[330px] flex-col py-5 sm:min-h-[350px] lg:min-h-[370px] lg:py-8'
                  : 'flex flex-col gap-3 py-3 lg:hidden'
              }
            >
              <div className="flex items-center justify-between gap-4">
                {isHomePage ? (
                  <LocationButton
                    label={locationLabel}
                    isPlaceholder={isLocationPlaceholder}
                    onClick={() => setLocationOpen(true)}
                    variant="stacked"
                  />
                ) : (
                  <HeaderLogo href={homeLink} isLockedRoute={isLockedRoute || lockedMode} />
                )}
                <HeaderActions
                  totalItems={displayTotalItems}
                  onAccountClick={handleAccountClick}
                  className="flex"
                />
              </div>

              {isHomePage && (
                <div className="mt-auto max-w-[68%] pb-1 sm:max-w-[62%] lg:max-w-[520px]">
                  <h1 className="text-[28px] font-bold leading-[1.12] tracking-[-0.035em] text-ink sm:text-[30px] lg:text-[38px]">
                    {hasMounted ? getGreeting() : 'Hello'}
                    {firstName ? `, ${firstName}` : ''}
                    <span aria-hidden="true"> 👋</span>
                  </h1>
                  <p className="mt-2 text-[15px] font-medium leading-6 text-ink-muted sm:text-base">
                    What are you craving today?
                  </p>
                </div>
              )}

              {!isHomePage && (
                <LocationButton
                  label={locationLabel}
                  isPlaceholder={isLocationPlaceholder}
                  onClick={() => setLocationOpen(true)}
                  variant="pill"
                />
              )}

              <SearchHeaderInput
                {...searchProps}
                variant={isHomePage ? 'hero' : 'default'}
                showFilter={isHomePage}
                className={isHomePage ? 'mt-4 shrink-0 lg:max-w-[760px]' : ''}
              />
            </div>

            {/* Desktop: one row — brand, location, search, actions. */}
            <div className={`items-center gap-5 py-4 ${isHomePage ? 'hidden' : 'hidden lg:flex'}`}>
              <HeaderLogo href={homeLink} isLockedRoute={isLockedRoute || lockedMode} />
              <LocationButton
                label={locationLabel}
                isPlaceholder={isLocationPlaceholder}
                onClick={() => setLocationOpen(true)}
                variant="pill"
              />
              <SearchHeaderInput {...searchProps} />
              <HeaderActions
                totalItems={displayTotalItems}
                onAccountClick={handleAccountClick}
                className="flex"
              />
            </div>
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function HeaderLogo({ href, isLockedRoute }: { href: string; isLockedRoute: boolean }) {
  return (
    <Link
      href={href}
      aria-label={isLockedRoute ? 'Back to restaurant home' : 'Mangaale home'}
      className="flex shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
    >
      <span className="text-[26px] font-extrabold leading-none tracking-[-0.04em] text-brand-900 lg:text-[30px]">
        Mangaale
      </span>
    </Link>
  );
}

interface LocationButtonProps {
  label: string;
  isPlaceholder: boolean;
  onClick: () => void;
  variant: 'pill' | 'stacked';
}

function LocationButton({ label, isPlaceholder, onClick, variant }: LocationButtonProps) {
  if (variant === 'stacked') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group min-w-0 rounded-control py-1 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        aria-label="Choose delivery location"
      >
        <span className="block text-[13px] font-semibold leading-4 text-ink-muted">Delivering to</span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[16px] font-bold leading-5 text-ink sm:text-[17px]">
          <MapPin className="h-[18px] w-[18px] shrink-0 fill-brand-700 text-brand-700" aria-hidden="true" />
          <span className={`truncate ${isPlaceholder ? 'text-ink-muted' : ''}`}>{label}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-brand-800"
            aria-hidden="true"
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-12 w-full min-w-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-left transition-colors hover:border-line-interactive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 lg:w-[220px] lg:shrink-0 xl:w-[250px]"
      aria-label="Choose delivery location"
    >
      <MapPin className="h-4 w-4 shrink-0 text-brand-800" aria-hidden="true" />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold ${
          isPlaceholder ? 'text-ink-muted' : 'text-ink'
        }`}
      >
        {label}
      </span>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-brand-800"
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
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_6px_20px_rgba(23,32,34,0.08)] transition-colors hover:border-line-interactive hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : 'Cart'}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {totalItems > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={onAccountClick}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_6px_20px_rgba(23,32,34,0.08)] transition-colors hover:border-line-interactive hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        aria-label="Account"
        title="Account"
      >
        <UserCircle className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
