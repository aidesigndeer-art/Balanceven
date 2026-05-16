import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import { ThemeProvider } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Float Bites by balanceven — De-bloat & Digest',
  description: 'Plant-based gummies engineered for the gut. Float through your day.',
  metadataBase: new URL('https://balanceven.com'),
  openGraph: {
    title: 'Float Bites by balanceven',
    description: 'De-bloat & digest gummies, engineered for the gut.',
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
        <ThemeProvider initial="dark">{children}</ThemeProvider>
      </body>
    </html>
  );
}
