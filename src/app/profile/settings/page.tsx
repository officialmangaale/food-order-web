import type { Metadata } from 'next';
import { ProfileSettingsPage } from '@/components/profile/ProfileSettingsPage';

export const metadata: Metadata = {
  title: 'Profile Settings | Mangaale',
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <ProfileSettingsPage />;
}
