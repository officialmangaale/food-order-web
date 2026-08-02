'use client';

import { RestaurantMenuItemCard } from '@/components/restaurant/RestaurantMenuItemCard';
import type { RestaurantMenuSectionData } from '@/components/restaurant/restaurantMenuTypes';
import type { MenuItem } from '@/types/menu';

interface RestaurantMenuSectionProps {
  section: RestaurantMenuSectionData;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  orderingDisabled?: boolean;
  disabledReason?: string;
  onCustomize: (item: MenuItem) => void;
  onConflict: (item: MenuItem) => void;
}

export function RestaurantMenuSection({
  section,
  restaurantId,
  restaurantName,
  restaurantSlug,
  orderingDisabled,
  disabledReason,
  onCustomize,
  onConflict,
}: RestaurantMenuSectionProps) {
  return (
    <section id={getSectionDomId(section.key)} className="scroll-mt-32">
      <div className="sr-only mb-4 items-center gap-3 lg:not-sr-only lg:flex">
        <h2 className="text-2xl font-extrabold tracking-normal text-[#120F0F] sm:text-[28px]">
          {section.title}
        </h2>
        {section.categoryType === 'offer' && (
          <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-extrabold uppercase text-[#EF4444]">
            Offer
          </span>
        )}
      </div>
      <div className="space-y-2 lg:space-y-5">
        {section.items.map((item) => (
          <RestaurantMenuItemCard
            key={`${section.key}-${item.id}`}
            item={item}
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            restaurantSlug={restaurantSlug}
            orderingDisabled={orderingDisabled}
            disabledReason={disabledReason}
            onCustomize={onCustomize}
            onConflict={onConflict}
          />
        ))}
      </div>
    </section>
  );
}

export function getSectionDomId(key: string) {
  return `menu-section-${key}`;
}
