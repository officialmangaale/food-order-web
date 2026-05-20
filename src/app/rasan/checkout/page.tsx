import type { Metadata } from 'next';
import { RasanCheckoutPage } from '@/components/rasan/RasanCheckoutPage';

export const metadata: Metadata = {
  title: 'Rasan Checkout | Mangaale',
  robots: { index: false, follow: false },
};

export default function RasanCheckoutRoutePage() {
  return <RasanCheckoutPage />;
}
