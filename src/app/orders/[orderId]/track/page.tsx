import type { Metadata } from 'next';
import { OrderTrackingPage } from '@/components/order/OrderTrackingPage';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: 'Track Order | Mangaale',
  robots: { index: false, follow: false },
};

export default async function TrackOrderRoute({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderTrackingPage orderId={orderId} />;
}
