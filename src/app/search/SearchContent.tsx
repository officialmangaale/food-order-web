'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search as SearchIcon, ArrowLeft, Star } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchNearbyRestaurants } from '@/services/restaurantApi';
import { useLocationStore } from '@/store/locationStore';
import { formatDistance } from '@/utils/distance';
import { useRouter } from 'next/navigation';

export function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lockedRestaurant = params.get('restaurant');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['search-restaurants', lat, lng],
    queryFn: () => fetchNearbyRestaurants(lat ?? 0, lng ?? 0, 1, 50),
    enabled: !lockedRestaurant,
  });

  const filtered = useMemo(() => {
    if (!restaurants || !debouncedQuery) return restaurants ?? [];
    const q = debouncedQuery.toLowerCase();
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine_types?.some(c => c.toLowerCase().includes(q))
    );
  }, [restaurants, debouncedQuery]);

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" autoFocus placeholder={lockedRestaurant ? `Search ${lockedRestaurant}...` : 'Search restaurants...'}
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cherry-500" />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && debouncedQuery && (
        <EmptyState icon="search" title="No results" description={`No restaurants found for "${debouncedQuery}"`} />
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <Link key={r.id} href={`/restaurants/${r.id}`}>
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex gap-3 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                {r.logo_url || r.banner_url ? (
                  <img src={r.logo_url || r.banner_url} alt={r.name} className="w-full h-full object-cover" />
                ) : <div className="w-full h-full food-placeholder" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{r.name}</h3>
                {r.cuisine_types?.length ? <p className="text-xs text-gray-500 truncate">{r.cuisine_types.join(', ')}</p> : null}
                <div className="flex items-center gap-2 mt-1">
                  {r.average_rating != null && r.average_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-green-700">
                      <Star className="w-3 h-3 fill-current" />{r.average_rating.toFixed(1)}
                    </span>
                  )}
                  {r.distance_km != null && <span className="text-xs text-gray-400">{formatDistance(r.distance_km)}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
