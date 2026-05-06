'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOrderTracking } from '@/hooks/useOrderSSE';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { formatMoney } from '@/utils/money';
import { getPhoneLink, getGoogleMapsUrl } from '@/utils/maps';
import { ORDER_STATUS_LABELS, isTerminalStatus } from '@/types/order';
import { useEffect } from 'react';

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { tracking, loading, error, connected, refetch } = useOrderTracking(Number(orderId));
  const updateStatus = useActiveOrderStore((s) => s.updateStatus);

  // Sync status to active order store
  useEffect(() => {
    if (tracking?.status) updateStatus(tracking.status);
  }, [tracking?.status, updateStatus]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !tracking) {
    return <PageShell><ErrorState title="Order not found" message={error ?? undefined} onRetry={refetch} /></PageShell>;
  }

  const label = ORDER_STATUS_LABELS[tracking.status] ?? tracking.status;
  const isTerminal = isTerminalStatus(tracking.status);

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Order #{tracking.order_number ?? orderId}</h1>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
        <Badge variant={connected ? 'success' : 'default'} dot>
          {connected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Polling</>}
        </Badge>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl p-4 mb-4 ${isTerminal ? 'bg-gray-50' : 'bg-cherry-50'}`}>
        <p className={`text-lg font-bold ${isTerminal ? 'text-gray-700' : 'text-cherry-700'}`}>{label}</p>
        {tracking.estimated_delivery_time && !isTerminal && (
          <p className="text-sm text-gray-600 mt-1">Estimated: {tracking.estimated_delivery_time}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
        <OrderTimeline currentStatus={tracking.status} />
      </div>

      {/* Restaurant info */}
      {tracking.restaurant_name && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4 flex items-center gap-3">
          {tracking.restaurant_logo_url && (
            <img src={tracking.restaurant_logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">{tracking.restaurant_name}</p>
          </div>
          {tracking.restaurant_phone && (
            <a href={getPhoneLink(tracking.restaurant_phone)} className="p-2 rounded-xl bg-green-50 text-green-600">
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>
      )}

      {/* Rider info */}
      {tracking.rider?.name && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Delivery Partner</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{tracking.rider.name}</p>
              {tracking.rider.vehicle_number && <p className="text-xs text-gray-500">{tracking.rider.vehicle_number}</p>}
            </div>
            {tracking.rider.phone && (
              <a href={getPhoneLink(tracking.rider.phone)} className="p-2 rounded-xl bg-green-50 text-green-600">
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>
        {tracking.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-gray-700">{item.quantity}× {item.name}</span>
            <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100 mt-2">
          <span>Total</span><span>{formatMoney(tracking.total)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Payment: Cash on Delivery</p>
      </div>

      {/* Delivery address */}
      {tracking.delivery_address && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-cherry-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{tracking.delivery_address.address_line1}</p>
              <p className="text-xs text-gray-500">{tracking.delivery_address.area}, {tracking.delivery_address.city} - {tracking.delivery_address.pincode}</p>
              {tracking.delivery_address.landmark && <p className="text-xs text-gray-400">Landmark: {tracking.delivery_address.landmark}</p>}
              {tracking.delivery_address.latitude && (
                <a href={getGoogleMapsUrl(tracking.delivery_address.latitude, tracking.delivery_address.longitude)}
                  target="_blank" rel="noopener noreferrer" className="text-xs text-cherry-600 font-medium mt-1 inline-block">
                  View on Map →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
