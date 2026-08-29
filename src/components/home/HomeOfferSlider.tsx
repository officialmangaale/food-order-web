'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';

import { SmartHeroImage } from '@/components/home/SmartHeroImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHomeMenuOffers } from '@/hooks/useHomeMenuOffers';
import type { HomeMenuOffer } from '@/types/offer';

/* ============================================================
   DEFAULT MANGAALE OFFER
============================================================ */

const GLOBAL_FALLBACK_OFFER: HomeMenuOffer = {
  id: 'mangaale-fallback',
  restaurantId: 0,
  restaurantName: 'Mangaale',
  title: 'Flat ₹100 OFF',
  subtitle: 'on your first 3 orders',
  badgeText: 'Limited time offer',
  ctaText: 'Order Now',
  ctaUrl: '/?category=offers#explore-categories',
};

/* ============================================================
   HOME OFFER SLIDER
============================================================ */

export function HomeOfferSlider() {
  const {
    data,
    isLoading,
    isError,
    hasCoordinates,
    isLockedRoute,
    lockedRestaurantId,
    lockedRestaurantName,
    lockedHomeLink,
  } = useHomeMenuOffers();

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const offers = useMemo(() => data ?? [], [data]);

  const fallbackOffer = useMemo(
    () =>
      getFallbackOffer({
        isLockedRoute,
        lockedRestaurantId,
        lockedRestaurantName,
        lockedHomeLink,
      }),
    [
      isLockedRoute,
      lockedRestaurantId,
      lockedRestaurantName,
      lockedHomeLink,
    ]
  );

  /*
   * Normal Home:
   * Mangaale banner + backend offers.
   *
   * Locked restaurant:
   * Backend restaurant offer or restaurant fallback.
   */
  const displayOffers = isLockedRoute
    ? !isError && offers.length > 0
      ? offers
      : fallbackOffer
        ? [fallbackOffer]
        : []
    : [
        GLOBAL_FALLBACK_OFFER,
        ...(!isError
          ? offers.filter(
              (offer) => offer.id !== GLOBAL_FALLBACK_OFFER.id
            )
          : []),
      ];

  const activeSlot = Math.min(
    activeIndex,
    Math.max(displayOffers.length - 1, 0)
  );

  const activeOffer = displayOffers[activeSlot];

  /*
   * Only show pagination when more than one banner exists.
   */
  const showDots = displayOffers.length > 1;

  const isStaticCampaign =
    activeOffer?.id === GLOBAL_FALLBACK_OFFER.id;

  const isLockedFallback =
    activeOffer?.id === 'locked-restaurant-fallback';

  /* ============================================================
     KEEP INDEX VALID
  ============================================================ */

  useEffect(() => {
    if (activeIndex < displayOffers.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex(0);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, displayOffers.length]);

  /* ============================================================
     AUTO SLIDE
  ============================================================ */

  useEffect(() => {
    if (
      isLockedFallback ||
      paused ||
      displayOffers.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % displayOffers.length
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    displayOffers.length,
    isLockedFallback,
    paused,
  ]);

  /* ============================================================
     LOADING / EMPTY
  ============================================================ */

  if (isLoading && isLockedRoute) {
    return <HomeOfferSkeleton />;
  }

  if (!activeOffer) {
    return null;
  }

  return (
    <motion.section
      className="home-offer-section page-container page-section"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      initial={false}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        margin: '-50px',
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {/* ======================================================
          MAIN BANNER CONTAINER

          IMPORTANT:
          Every banner uses the SAME 3:1 ratio.
          This prevents the slider height from jumping.
      ====================================================== */}

      <div
        className="
          relative
          aspect-[3/1]
          w-full
          overflow-hidden
          rounded-[20px]
          bg-[#effbf8]
          shadow-card
        "
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={String(activeOffer.id)}
            className="absolute inset-0 overflow-hidden"
            initial={{
              opacity: 0,
              x: 24,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -24,
            }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* ==================================================
                STATIC MANGAALE BANNER
            ================================================== */}

            {isStaticCampaign ? (
              <Link
                href="/?category=offers#explore-categories"
                aria-label="View limited-time offers"
                className="
                  absolute
                  inset-0
                  block
                  overflow-hidden
                  focus-visible:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-inset
                  focus-visible:ring-brand-700/30
                "
              >
                <Image
                  src="/images/mangaale_banner_image.png"
                  alt="Limited time offer: Flat ₹100 off on your first 3 orders"
                  fill
                  priority
                  sizes="
                    (max-width: 640px) calc(100vw - 32px),
                    (max-width: 1280px) calc(100vw - 48px),
                    1280px
                  "
                  className="
                    scale-[1.04]
                    object-cover
                    object-center
                  "
                />
              </Link>
            ) : (
              /* ==================================================
                  BACKEND / RESTAURANT BANNER
              ================================================== */

              <>
                {/* Background image */}
                <div className="absolute inset-0">
                  <SmartHeroImage
                    key={
                      activeOffer.imageUrl ||
                      String(activeOffer.id)
                    }
                    src={activeOffer.imageUrl}
                    fallbackSrc={
                      activeOffer.fallbackImageUrl ||
                      '/images/food-delivery-hero.png'
                    }
                    alt={getOfferImageAlt(activeOffer)}
                    priority={activeSlot === 0}
                  />
                </div>

                {/* Readability gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, #EFFBF8 0%, #EFFBF8 39%, rgba(239,251,248,0.94) 52%, rgba(239,251,248,0.55) 66%, rgba(239,251,248,0.08) 100%)',
                  }}
                />

                {/* ==================================================
                    BACKEND OFFER CONTENT
                ================================================== */}

                <div
                  className="
                    relative
                    z-10
                    flex
                    h-full
                    w-[68%]
                    flex-col
                    justify-center
                    px-4
                    py-2

                    sm:w-[62%]
                    sm:px-6

                    md:w-[58%]
                    md:px-7

                    lg:w-[55%]
                    lg:px-8
                  "
                >
                  {/* Offer badge */}
                  <span
                    className="
                      inline-flex
                      w-fit
                      rounded-full
                      bg-brand-100
                      px-2.5
                      py-1
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-[0.1em]
                      text-brand-900

                      sm:text-[9px]
                      md:text-[10px]
                    "
                  >
                    {activeOffer.badgeText ||
                      'Exclusive Offer'}
                  </span>

                  {/* Offer title */}
                  <h2
                    className="
                      mt-1.5
                      line-clamp-2
                      max-w-[520px]
                      text-[16px]
                      font-extrabold
                      leading-[1.08]
                      tracking-[-0.03em]
                      text-ink

                      sm:mt-2
                      sm:text-[21px]

                      md:text-[26px]

                      lg:text-[30px]

                      xl:text-[34px]
                    "
                  >
                    {activeOffer.title}
                  </h2>

                  {/* Subtitle */}
                  {activeOffer.subtitle && (
                    <p
                      className="
                        mt-1
                        line-clamp-2
                        max-w-[430px]
                        text-[9px]
                        font-medium
                        leading-[1.25]
                        text-ink-muted

                        sm:text-[11px]

                        md:text-[13px]

                        lg:text-sm
                      "
                    >
                      {activeOffer.subtitle}
                    </p>
                  )}

                  {/* CTA row */}
                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2

                      sm:mt-2.5

                      md:mt-3
                    "
                  >
                    <OfferCta
                      offer={activeOffer}
                      isLockedRoute={isLockedRoute}
                      lockedHomeLink={lockedHomeLink}
                    />

                    {!hasCoordinates &&
                      !isLockedRoute && (
                        <span
                          className="
                            hidden
                            items-center
                            gap-1.5
                            rounded-full
                            bg-white/80
                            px-2.5
                            py-1.5
                            text-[10px]
                            font-semibold
                            text-ink-muted
                            backdrop-blur

                            lg:inline-flex

                            xl:px-3
                            xl:py-2
                            xl:text-xs
                          "
                        >
                          <MapPin
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />

                          Set location to see nearby offers
                        </span>
                      )}
                  </div>

                  {/* Restaurant / delivery metadata */}
                  {(activeOffer.restaurantName ||
                    activeOffer.deliveryTime ||
                    activeOffer.distanceKm != null) && (
                    <p
                      className="
                        mt-2
                        hidden
                        line-clamp-1
                        text-[10px]
                        font-semibold
                        text-ink-muted

                        sm:block

                        md:text-[11px]

                        lg:text-xs
                      "
                    >
                      {[
                        activeOffer.restaurantName,
                        activeOffer.displayPrice,
                        activeOffer.deliveryTime,
                        formatDistance(
                          activeOffer.distanceKm
                        ),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {(isStaticCampaign ||
          isLockedFallback ||
          isError) && (
          <span className="sr-only">
            Mangaale featured offer
          </span>
        )}
      </div>

      {/* ======================================================
          PAGINATION DOTS

          1 banner = hidden
          2 banners = 2 indicators
          4 banners = 4 indicators
      ====================================================== */}

      {showDots && (
        <div
          className="
            mt-2
            flex
            items-center
            justify-center
            gap-1.5
          "
          aria-label="Offer slider pagination"
        >
          {displayOffers.map((offer, index) => {
            const isActive =
              index === activeSlot;

            return (
              <button
                key={String(offer.id)}
                type="button"
                aria-label={`Show offer ${index + 1}`}
                aria-current={
                  isActive
                    ? 'true'
                    : undefined
                }
                onClick={() =>
                  setActiveIndex(index)
                }
                className={`
                  h-1.5
                  rounded-full
                  transition-all
                  duration-300

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand-700
                  focus-visible:ring-offset-2

                  ${
                    isActive
                      ? 'w-5 bg-brand-700'
                      : 'w-1.5 bg-ink-subtle/35 hover:bg-brand-400'
                  }
                `}
              />
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

/* ============================================================
   OFFER CTA
============================================================ */

function OfferCta({
  offer,
  isLockedRoute,
  lockedHomeLink,
}: {
  offer: HomeMenuOffer;
  isLockedRoute: boolean;
  lockedHomeLink: string;
}) {
  const href = getOfferHref(
    offer,
    isLockedRoute,
    lockedHomeLink
  );

  const className = `
    inline-flex
    h-7
    items-center
    justify-center
    gap-1.5
    whitespace-nowrap
    rounded-full
    bg-brand-700
    px-3
    text-[10px]
    font-extrabold
    text-white
    shadow-brand
    transition-colors

    hover:bg-brand-800

    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-brand-700/25

    sm:h-8
    sm:px-4
    sm:text-xs

    md:h-9
    md:px-4

    lg:h-10
    lg:px-5
    lg:text-sm
  `;

  /* External URL */
  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        className={className}
      >
        {offer.ctaText || 'Order Now'}

        <ArrowRight
          className="
            h-3
            w-3

            sm:h-3.5
            sm:w-3.5

            lg:h-4
            lg:w-4
          "
          aria-hidden="true"
        />
      </a>
    );
  }

  /* Internal Next.js route */
  return (
    <Link
      href={href}
      className={className}
    >
      {offer.ctaText || 'Order Now'}

      <ArrowRight
        className="
          h-3
          w-3

          sm:h-3.5
          sm:w-3.5

          lg:h-4
          lg:w-4
        "
        aria-hidden="true"
      />
    </Link>
  );
}

/* ============================================================
   FALLBACK OFFER
============================================================ */

function getFallbackOffer({
  isLockedRoute,
  lockedRestaurantId,
  lockedRestaurantName,
  lockedHomeLink,
}: {
  isLockedRoute: boolean;
  lockedRestaurantId: number | null;
  lockedRestaurantName: string | null;
  lockedHomeLink: string;
}): HomeMenuOffer | null {
  if (isLockedRoute) {
    const restaurantName =
      lockedRestaurantName ??
      'this restaurant';

    return {
      id: 'locked-restaurant-fallback',
      restaurantId:
        lockedRestaurantId ?? 0,
      restaurantName,
      title: `Order from ${restaurantName}`,
      subtitle:
        "Browse this restaurant's menu and place your delivery order.",
      badgeText: 'Mangaale',
      ctaText: 'View Menu',
      ctaUrl: lockedHomeLink,
    };
  }

  return GLOBAL_FALLBACK_OFFER;
}

/* ============================================================
   OFFER LINK
============================================================ */

function getOfferHref(
  offer: HomeMenuOffer,
  isLockedRoute: boolean,
  lockedHomeLink: string
) {
  if (
    isLockedRoute &&
    lockedHomeLink.startsWith('/r/')
  ) {
    return lockedHomeLink;
  }

  return (
    offer.ctaUrl ||
    (offer.restaurantId
      ? `/restaurants/${offer.restaurantId}`
      : '/')
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function HomeOfferSkeleton() {
  return (
    <section
      className="
        page-container
        page-section
      "
      aria-label="Loading offers"
    >
      <Skeleton
        className="
          aspect-[3/1]
          w-full
          rounded-[20px]
        "
      />
    </section>
  );
}

/* ============================================================
   IMAGE ALT
============================================================ */

function getOfferImageAlt(
  offer: HomeMenuOffer
) {
  return (
    [
      offer.title,
      offer.restaurantName,
    ]
      .filter(Boolean)
      .join(' from ') ||
    'Mangaale food offer'
  );
}

/* ============================================================
   DISTANCE
============================================================ */

function formatDistance(
  distanceKm?: number
) {
  if (distanceKm == null) {
    return undefined;
  }

  return `${distanceKm.toFixed(
    distanceKm < 10 ? 1 : 0
  )} km away`;
}