import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomCartBar } from '@/components/layout/BottomCartBar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Mangaale — Food Delivery',
  description: 'Order food from your favourite local restaurants. Fast delivery within 7 km.',
  openGraph: {
    title: 'Mangaale — Food Delivery',
    description: 'Order food from your favourite local restaurants.',
    siteName: 'Mangaale',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>
            <AppHeader />
            {children}
            <BottomCartBar />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
