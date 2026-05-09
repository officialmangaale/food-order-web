import type { Metadata } from 'next';
import { ProfileAddressesPage } from '@/components/profile/ProfileAddressesPage';

export const metadata: Metadata = {
  title: 'Addresses | Mangaale',
  robots: { index: false, follow: false },
};

export default function AddressesPage() {
  return <ProfileAddressesPage />;
}
