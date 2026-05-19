import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import { ThemeProvider } from '@/lib/theme';
import { Nav } from '@/components/ui/Nav';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fly Bites by balanceven — Energy gummies',
  description: 'Plant-based energy gummies. Clean lift, no crash. Fly through your day.',
  metadataBase: new URL('https://balanceven.com'),
  openGraph: {
    title: 'Fly Bites by balanceven',
    description: 'Energy gummies, engineered to lift you cleanly. 18 count.',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider initial="dark">
          <SmoothScroll>
            <Nav />
            {children}
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
