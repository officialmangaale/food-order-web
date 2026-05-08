'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, PackageSearch, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProfilePageLayout } from '@/components/profile/ProfilePageLayout';
import { ProfileRouteGuard } from '@/components/profile/ProfileRouteGuard';
import {
  getItemSummary,
  getOrderDate,
  getOrderStatusLabel,
  getOrderTotal,
} from '@/components/profile/profileUtils';
import { getCustomerOrders, type CustomerOrder } from '@/services/customerOrdersApi';
import { isAuthError } from '@/services/http';
import { useAuthStore } from '@/store/authStore';
import { formatMoney } from '@/utils/money';

export function ProfileOrdersPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-orders', token],
    queryFn: () => getCustomerOrders(token as string, { page: 1, limit: 10 }),
    enabled: Boolean(isAuthenticated && token),
    retry: (failureCount, err) => !isAuthError(err) && failureCount < 1,
  });

  useEffect(() => {
    if (error && isAuthError(error)) logout();
  }, [error, logout]);

  const handleReorder = (order: CustomerOrder) => {
    if (order.restaurant_id) {
      router.push(`/restaurants/${order.restaurant_id}`);
      return;
    }
    router.push('/');
  };

  return (
    <ProfileRouteGuard>
      <ProfilePageLayout title="My Orders">
        {isLoading ? (
          <OrdersSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-[#F0DADA] bg-white shadow-card">
            <ErrorState
              title="Could not load orders"
              message="Please try again in a moment."
              onRetry={() => refetch()}
            />
          </div>
        ) : data?.orders.length ? (
          <div className="space-y-4">
            {data.orders.map((order) => (
              <OrderCard key={String(order.order_id)} order={order} onReorder={() => handleReorder(order)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#F0DADA] bg-white shadow-card">
            <EmptyState
              icon="cart"
              title="No orders yet"
              description="Restaurants you order from will appear here."
              actionLabel="Browse restaurants"
              onAction={() => router.push('/')}
            />
          </div>
        )}
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}

function OrderCard({ order, onReorder }: { order: CustomerOrder; onReorder: () => void }) {
  const canReorder = order.items.length > 0;
  const orderId = String(order.order_id || order.id || '');

  return (
    <article className="rounded-2xl border border-[#F0DADA] bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-[#1F1A1A]">
                {order.restaurant_name || 'Restaurant'}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#6B5B5B]">{getOrderDate(order)}</p>
            </div>
            <Badge variant={getStatusVariant(order.status)} className="capitalize">
              {getOrderStatusLabel(order.status)}
            </Badge>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#2B2020]">{getItemSummary(order.items)}</p>
          {order.order_number && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8F6B65]">
              Order #{order.order_number}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:min-w-52 lg:flex-col lg:items-end">
          <p className="text-2xl font-extrabold text-[#1F1A1A]">{formatMoney(getOrderTotal(order))}</p>
          <div className="flex flex-wrap gap-2">
            {orderId && (
              <Link
                href={`/orders/${orderId}/track`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#A80F15] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8F0D12]"
              >
                Track
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            {canReorder && (
              <Button
                variant="outline"
                className="min-h-11 border-[#E7B8B3] text-[#A80F15] hover:bg-[#FFF0F0]"
                onClick={onReorder}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reorder
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function getStatusVariant(status: CustomerOrder['status']) {
  const value = String(status);
  if (['delivered', 'completed'].includes(value)) return 'success';
  if (['cancelled', 'rejected', 'declined'].includes(value)) return 'error';
  if (['pending', 'placed', 'accepted', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(value)) {
    return 'cherry';
  }
  return 'default';
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-3">
          <PackageSearch className="h-5 w-5 text-[#A80F15]" aria-hidden="true" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}
