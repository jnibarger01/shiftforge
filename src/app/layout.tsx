import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://jnibarger01.github.io/shiftforge/'),
  title: {
    default: 'ShiftForge — Realtime 3D Car Customizer + AI Concept Renders',
    template: '%s | ShiftForge',
  },
  description:
    'Build a modified car in realtime 3D, tune paint, wheels, stance and aero, then generate a photoreal AI concept from the same spec.',
  openGraph: {
    type: 'website',
    siteName: 'ShiftForge',
    title: 'ShiftForge — Build it before you buy it',
    description:
      'Realtime 3D automotive customization with optional AI concept rendering.',
  },
  alternates: {
    canonical: 'https://jnibarger01.github.io/shiftforge/',
  },
};

export const viewport: Viewport = {
  themeColor: '#080a0d',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      </body>
    </html>
  );
}
