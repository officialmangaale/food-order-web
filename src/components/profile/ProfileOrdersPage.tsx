'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PanelSkeleton } from '@/components/ui/Skeleton';
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
import { getOrderStatusBadgeVariant } from '@/utils/orderStatus';

export function ProfileOrdersPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, error, refetch } = useQuery({
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
      <ProfilePageLayout title="Your orders">
        {isLoading ? (
          <div className="space-y-4">
            <PanelSkeleton className="h-40" />
            <PanelSkeleton className="h-40" />
            <PanelSkeleton className="h-40" />
          </div>
        ) : error ? (
          <ErrorState
            title="Could not load orders"
            message="Please try again in a moment."
            onRetry={() => refetch()}
          />
        ) : data?.orders.length ? (
          <div className="space-y-4">
            {data.orders.map((order) => (
              <OrderCard
                key={String(order.order_id)}
                order={order}
                onReorder={() => handleReorder(order)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="order"
            title="No orders yet"
            description="Restaurants you order from will appear here."
            actionLabel="Browse restaurants"
            onAction={() => router.push('/')}
          />
        )}
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}

function OrderCard({ order, onReorder }: { order: CustomerOrder; onReorder: () => void }) {
  const canReorder = order.items.length > 0;
  const orderId = String(order.order_id || order.id || '');

  return (
    <Card as="article">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-ink sm:text-lg">
                {order.restaurant_name || 'Restaurant'}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{getOrderDate(order)}</p>
            </div>
            <Badge variant={getOrderStatusBadgeVariant(order.status)} dot>
              {getOrderStatusLabel(order.status)}
            </Badge>
          </div>

          <p className="mt-3 text-sm leading-6 text-ink-muted">{getItemSummary(order.items)}</p>
          {order.order_number && (
            <p className="mt-2 text-eyebrow uppercase text-ink-subtle">
              Order #{order.order_number}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:min-w-48 lg:items-end">
          <p className="text-section text-ink">{formatMoney(getOrderTotal(order))}</p>
          <div className="flex flex-wrap gap-2">
            {orderId && (
              <ButtonLink href={`/orders/${orderId}/track`} variant="primary" size="sm">
                Track
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            )}
            {canReorder && (
              <Button variant="outline" size="sm" onClick={onReorder}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reorder
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
