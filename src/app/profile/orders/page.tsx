import type { Metadata } from 'next';
import { ProfileOrdersPage } from '@/components/profile/ProfileOrdersPage';

export const metadata: Metadata = {
  title: 'Orders | Mangaale',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <ProfileOrdersPage />;
}
