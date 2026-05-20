import type { Metadata } from 'next';
import { RasanTrackingPage } from '@/components/rasan/RasanTrackingPage';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: 'Track Rasan Order | Mangaale',
  robots: { index: false, follow: false },
};

export default async function RasanTrackRoutePage({ params }: PageProps) {
  const { orderId } = await params;
  return <RasanTrackingPage orderId={orderId} />;
}
