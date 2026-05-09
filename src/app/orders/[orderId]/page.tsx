import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: 'Order | Mangaale',
  robots: { index: false, follow: false },
};

export default async function OrderDetailsRedirect({ params }: PageProps) {
  const { orderId } = await params;
  redirect(`/orders/${orderId}/track`);
}
