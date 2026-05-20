import type { Metadata } from 'next';
import { RasanMerchantPage } from '@/components/rasan/RasanMerchantPage';

interface PageProps {
  params: Promise<{ merchantId: string }>;
}

export const metadata: Metadata = {
  title: 'Rasan Store | Mangaale',
};

export default async function RasanMerchantRoutePage({ params }: PageProps) {
  const { merchantId } = await params;
  return <RasanMerchantPage merchantId={merchantId} />;
}
