import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailsRedirect({ params }: PageProps) {
  const { orderId } = await params;
  redirect(`/orders/${orderId}/track`);
}
