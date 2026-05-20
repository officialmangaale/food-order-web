import type { Metadata } from 'next';
import { RasanHomePage } from '@/components/rasan/RasanHomePage';

export const metadata: Metadata = {
  title: 'Mangaale Rasan | Grocery Delivery',
  description: 'Order daily groceries from Mangaale Rasan and registered local kirana stores.',
};

export default function RasanRoutePage() {
  return <RasanHomePage />;
}
