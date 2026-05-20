'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Minus, Plus, Search, ShoppingBasket, Store } from 'lucide-react';
import { GroceryCartConflictModal } from '@/components/rasan/GroceryCartConflictModal';
import { toGroceryCartItem } from '@/components/rasan/groceryCartUtils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasMounted } from '@/hooks/useHasMounted';
import { fetchGroceryMerchantProducts } from '@/services/groceryApi';
import { useGroceryCartStore } from '@/store/groceryCartStore';
import { useLocationStore } from '@/store/locationStore';
import { formatMoney } from '@/utils/money';
import type { GroceryMerchant, GroceryProduct, GroceryProductCategory } from '@/types/grocery';

interface RasanMerchantPageProps {
  merchantId: string;
}

export function RasanMerchantPage({ merchantId }: RasanMerchantPageProps) {
  const hasMounted = useHasMounted();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [pendingProduct, setPendingProduct] = useState<GroceryProduct | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 220);
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const hasLocation = latitude != null && longitude != null;
  const cartItems = useGroceryCartStore((state) => state.items);
  const cartMerchantId = useGroceryCartStore((state) => state.groceryMerchantId);
  const setMerchant = useGroceryCartStore((state) => state.setMerchant);
  const addItem = useGroceryCartStore((state) => state.addItem);
  const updateQuantity = useGroceryCartStore((state) => state.updateQuantity);
  const isDifferentMerchant = useGroceryCartStore((state) =>
    state.isDifferentMerchant(Number(merchantId))
  );
  const totalItems = useGroceryCartStore((state) => state.totalItems());
  const cartSubtotal = useGroceryCartStore((state) => state.estimatedSubtotal());

  const productsQuery = useQuery({
    queryKey: ['grocery-products', merchantId, latitude, longitude],
    queryFn: () =>
      fetchGroceryMerchantProducts({
        merchantId,
        lat: latitude as number,
        lng: longitude as number,
      }),
    enabled: hasLocation && Boolean(merchantId),
    retry: 1,
  });

  const response = productsQuery.data;
  const fallbackMerchant = useMemo<GroceryMerchant>(
    () => ({
      id: Number(merchantId) || 0,
      name: 'Mangaale Rasan',
      tags: ['Daily essentials'],
      is_open: true,
    }),
    [merchantId]
  );
  const merchant = response?.merchant ?? fallbackMerchant;
  const categories = useMemo(() => response?.categories ?? [], [response?.categories]);
  const filteredCategories = useMemo(
    () => filterCategories(categories, activeCategory, debouncedSearch),
    [activeCategory, categories, debouncedSearch]
  );
  const visibleProductsCount = filteredCategories.reduce(
    (sum, category) => sum + category.products.length,
    0
  );

  useEffect(() => {
    const handleHeaderSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string } | string>;
      const query =
        typeof customEvent.detail === 'string'
          ? customEvent.detail
          : customEvent.detail?.query ?? '';
      setSearch(query);
      window.setTimeout(() => {
        document.getElementById('rasan-products')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 20);
    };

    window.addEventListener('mangaale:grocery-search', handleHeaderSearch as EventListener);
    return () => {
      window.removeEventListener('mangaale:grocery-search', handleHeaderSearch as EventListener);
    };
  }, []);

  const addProduct = (product: GroceryProduct) => {
    if (product.is_available === false) {
      toast('This product is out of stock.', 'error');
      return;
    }

    if (merchant.is_open === false) {
      toast('This grocery store is closed right now.', 'error');
      return;
    }

    setMerchant(merchant.id, merchant.name, merchant.slug);
    addItem(toGroceryCartItem({ ...product, grocery_merchant_id: merchant.id }));
    toast(`${product.name} added to Rasan cart`, 'success');
  };

  const handleAdd = (product: GroceryProduct) => {
    if (isDifferentMerchant) {
      setPendingProduct(product);
      setConflictOpen(true);
      return;
    }

    addProduct(product);
  };

  const handleConflictCleared = () => {
    if (!pendingProduct) return;
    addProduct(pendingProduct);
    setPendingProduct(null);
  };

  if (!hasMounted) return <RasanMerchantSkeleton />;

  if (!hasLocation) {
    return (
      <main className="min-h-screen bg-[#F7FBF4]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="rounded-2xl border border-[#DCE8D4] bg-white p-8 text-center shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
            <ShoppingBasket className="mx-auto h-10 w-10 text-[#3F7226]" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-extrabold text-[#1C2616]">Location required</h1>
            <p className="mt-2 text-sm leading-6 text-[#66745E]">
              Set your delivery location from the header to see grocery products available nearby.
            </p>
            <Link
              href="/rasan"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6B1F] px-5 text-sm font-extrabold text-white transition hover:bg-[#265719]"
            >
              Back to Rasan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (productsQuery.isLoading) return <RasanMerchantSkeleton />;

  if (productsQuery.error) {
    return (
      <main className="min-h-screen bg-[#F7FBF4]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-extrabold text-[#1C2616]">Products unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-[#66745E]">We could not load this grocery store.</p>
            <button
              type="button"
              onClick={() => productsQuery.refetch()}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6B1F] px-5 text-sm font-extrabold text-white transition hover:bg-[#265719]"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7FBF4] pb-24">
      <section className="border-b border-[#DCE8D4] bg-[#F9FCF7]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div>
            <Link href="/rasan" className="text-sm font-extrabold text-[#3F7226] hover:underline">
              Rasan stores
            </Link>
            <div className="mt-3 flex items-start gap-4">
              <MerchantLogo merchant={merchant} />
              <div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-[#1C2616] sm:text-5xl">
                  {merchant.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#66745E]">
                  <span>Daily essentials</span>
                  {merchant.distance && <span>{merchant.distance}</span>}
                  {merchant.delivery_time && <span>{merchant.delivery_time}</span>}
                  {merchant.delivery_fee != null && (
                    <span>{merchant.delivery_fee > 0 ? `${formatMoney(merchant.delivery_fee)} delivery` : 'Free delivery'}</span>
                  )}
                  <span className={merchant.is_open === false ? 'text-[#A46B00]' : 'text-[#2F6B1F]'}>
                    {merchant.is_open === false ? 'Closed' : 'Open now'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {totalItems > 0 && (
            <Link
              href="/rasan/cart"
              className="flex min-h-[92px] items-center justify-between rounded-2xl border border-[#C9DDBA] bg-white p-4 shadow-sm transition hover:bg-[#F3FAEF]"
            >
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#5E7D2B]">Rasan cart</p>
                <p className="mt-1 text-lg font-extrabold text-[#1C2616]">
                  {totalItems} item{totalItems === 1 ? '' : 's'} - {formatMoney(cartSubtotal)}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#3F7226]" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      {merchant.is_open === false && (
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            This grocery store is closed right now. You can browse, but ordering is paused.
          </div>
        </div>
      )}

      <section id="rasan-products" className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-2 border-r border-[#DCE8D4] pr-4">
            <CategoryButton
              active={activeCategory === 'all'}
              label="All"
              count={response?.products.length ?? 0}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                active={activeCategory === category.id}
                label={category.name}
                count={category.products.length}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </aside>

        <div>
          <div className="sticky top-[88px] z-10 -mx-4 border-b border-[#DCE8D4] bg-[#F7FBF4]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:p-3 lg:top-24">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66745E]" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search atta, oil, rice..."
                className="h-12 w-full rounded-full border border-[#C9DDBA] bg-white pl-11 pr-4 text-sm font-semibold text-[#1C2616] outline-none transition placeholder:text-[#8B9982] focus:border-[#6F9C3C] focus:ring-4 focus:ring-[#6F9C3C]/12"
              />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar lg:hidden">
              <MobileCategoryPill active={activeCategory === 'all'} label="All" onClick={() => setActiveCategory('all')} />
              {categories.map((category) => (
                <MobileCategoryPill
                  key={category.id}
                  active={activeCategory === category.id}
                  label={category.name}
                  onClick={() => setActiveCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {visibleProductsCount === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#DCE8D4] bg-white p-8 text-center">
              <ShoppingBasket className="mx-auto h-9 w-9 text-[#8BAE65]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold text-[#1C2616]">No products found</h2>
              <p className="mt-2 text-sm text-[#66745E]">Try another search or category.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-8">
              {filteredCategories.map((category) => (
                <section key={category.id}>
                  <h2 className="mb-3 text-xl font-extrabold text-[#1C2616]">{category.name}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {category.products.map((product) => (
                      <GroceryProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          cartMerchantId === merchant.id
                            ? cartItems.find((item) => item.grocery_product_id === product.id)?.quantity ?? 0
                            : 0
                        }
                        disabled={merchant.is_open === false}
                        onAdd={() => handleAdd(product)}
                        onIncrease={() => handleAdd(product)}
                        onDecrease={() => updateQuantity(product.id, Math.max(0, (cartItems.find((item) => item.grocery_product_id === product.id)?.quantity ?? 0) - 1))}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <GroceryCartConflictModal
        open={conflictOpen}
        onClose={() => {
          setConflictOpen(false);
          setPendingProduct(null);
        }}
        newMerchantName={merchant.name}
        onCleared={handleConflictCleared}
      />
    </main>
  );
}

function GroceryProductCard({
  product,
  quantity,
  disabled,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  product: GroceryProduct;
  quantity: number;
  disabled?: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const unavailable = product.is_available === false;
  const canShowImage = Boolean(product.image_url && !imageFailed);
  const showMrp = product.mrp != null && product.mrp > product.selling_price;

  return (
    <article className={`flex min-h-[172px] gap-3 rounded-2xl border bg-white p-3 shadow-[0_10px_26px_rgba(47,74,27,0.05)] ${unavailable ? 'border-[#DFE4DD] opacity-70' : 'border-[#DCE8D4]'}`}>
      <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF7E8] sm:h-32 sm:w-28">
        {canShowImage ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ShoppingBasket className="h-9 w-9 text-[#7DA35B]" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6F8B52]">
          {product.brand || product.category_name || 'Rasan'}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-snug text-[#1C2616]">
          {product.name}
        </h3>
        {product.package_size && (
          <p className="mt-1 text-sm font-semibold text-[#66745E]">{product.package_size}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            {showMrp && (
              <p className="text-xs font-semibold text-[#8B9982] line-through">{formatMoney(product.mrp)}</p>
            )}
            <p className="text-lg font-extrabold text-[#1C2616]">{formatMoney(product.selling_price)}</p>
          </div>
          {quantity > 0 && !unavailable ? (
            <div className="flex h-9 items-center rounded-lg bg-[#2F6B1F] text-white shadow-[0_8px_18px_rgba(47,107,31,0.22)]">
              <button
                type="button"
                onClick={onDecrease}
                className="flex h-9 w-9 items-center justify-center rounded-l-lg transition hover:bg-white/10"
                aria-label={`Decrease ${product.name}`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-7 text-center text-sm font-extrabold">{quantity}</span>
              <button
                type="button"
                onClick={onIncrease}
                className="flex h-9 w-9 items-center justify-center rounded-r-lg transition hover:bg-white/10"
                aria-label={`Increase ${product.name}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={unavailable || disabled}
              className="h-9 min-w-20 rounded-lg border border-[#AFCB9D] bg-white px-3 text-xs font-extrabold text-[#2F6B1F] shadow-sm transition hover:border-[#2F6B1F] hover:bg-[#2F6B1F] hover:text-white disabled:cursor-not-allowed disabled:border-[#DFE4DD] disabled:text-[#9EAA99]"
            >
              {unavailable ? 'Out' : 'ADD'}
            </button>
          )}
        </div>
        {unavailable && (
          <p className="mt-2 text-xs font-bold uppercase tracking-normal text-[#9D2B20]">Out of stock</p>
        )}
      </div>
    </article>
  );
}

function MerchantLogo({ merchant }: { merchant: GroceryMerchant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(merchant.logo_url && !imageFailed);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#C9DDBA] bg-white text-[#3F7226] shadow-sm sm:h-20 sm:w-20">
      {canShowImage ? (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Store className="h-8 w-8" aria-hidden="true" />
      )}
    </div>
  );
}

function CategoryButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-extrabold transition ${
        active ? 'bg-[#E8F6D7] text-[#2F4A1B]' : 'text-[#5D6D54] hover:bg-white'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 text-xs font-bold text-[#8B9982]">{count}</span>
    </button>
  );
}

function MobileCategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-extrabold transition ${
        active
          ? 'border-[#2F6B1F] bg-[#2F6B1F] text-white'
          : 'border-[#C9DDBA] bg-white text-[#53614B]'
      }`}
    >
      {label}
    </button>
  );
}

function filterCategories(categories: GroceryProductCategory[], activeCategory: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return categories
    .filter((category) => activeCategory === 'all' || category.id === activeCategory)
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => {
        if (!normalizedQuery) return true;
        return [product.name, product.brand, product.package_size, product.category_name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      }),
    }))
    .filter((category) => category.products.length > 0);
}

function RasanMerchantSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden space-y-3 lg:block">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-[172px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
