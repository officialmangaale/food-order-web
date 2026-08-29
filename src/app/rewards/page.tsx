import type { Metadata } from 'next';
import { LoyaltyHub } from '@/components/loyalty/LoyaltyHub';

export const metadata: Metadata = {
  title: 'Mangaale Rewards | Coins, perks and activity',
  description: 'View your verified Mangaale Coins, live rewards, and loyalty activity.',
  robots: { index: false, follow: false },
};

export default function RewardsPage() {
  return <LoyaltyHub />;
}
