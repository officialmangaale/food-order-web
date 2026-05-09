import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Cart | Mangaale',
  robots: { index: false, follow: false },
};

export default function CartRoutePage() {
  return <CartPage />;
}
