import type { Metadata } from 'next';
import { RasanCartPage } from '@/components/rasan/RasanCartPage';

export const metadata: Metadata = {
  title: 'Rasan Cart | Mangaale',
  robots: { index: false, follow: false },
};

export default function RasanCartRoutePage() {
  return <RasanCartPage />;
}
