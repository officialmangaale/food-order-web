import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomCartBar } from '@/components/layout/BottomCartBar';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mangaale Food Delivery',
  description: 'Order food from your favourite local restaurants. Fast delivery within 7 km.',
  openGraph: {
    title: 'Mangaale Food Delivery',
    description: 'Order food from your favourite local restaurants.',
    siteName: 'Mangaale',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#075e54',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <Providers>
          <ToastProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-900 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
            >
              Skip to content
            </a>
            <AppHeader />
            {children}
            <SiteFooter />
            <BottomCartBar />
            <MobileBottomNavigation />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
