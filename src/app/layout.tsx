import type { Metadata, Viewport } from 'next';
import { DM_Mono, Roboto } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { cartCount } from '@/lib/content';
import './globals.css';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-roboto' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'ShiftForge | 3D Car Configurator, Wheel Fitment & Tuning Community', template: '%s | ShiftForge' },
  description: 'Build your car in 3D with real wheel fitment math, share it with the community, vote in weekly ratings and shop wheels, tires and suspension.',
  openGraph: { siteName: 'ShiftForge', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#181818', width: 'device-width', initialScale: 1 };

// Apply the saved theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('sf-theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cart = user ? cartCount(user.id) : 0;
  return (
    <html lang="en" className={`${roboto.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header user={user ? { id: user.id, name: user.name, color: user.avatarColor } : null} cartCount={cart} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
