import type { Metadata } from 'next';
import { ProfileOverview } from '@/components/profile/ProfileOverview';

export const metadata: Metadata = {
  title: 'Profile | Mangaale',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileOverview />;
}
