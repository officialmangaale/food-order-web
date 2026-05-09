import { OrderTrackingPage } from '@/components/order/OrderTrackingPage';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function TrackOrderRoute({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderTrackingPage orderId={orderId} />;
}
