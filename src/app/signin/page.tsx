import type { Metadata } from 'next';
import AccountPanel from '@/components/AccountPanel';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Connect an optional Puter account for cloud build copies and AI generation.',
  alternates: {
    canonical: 'https://jnibarger01.github.io/shiftforge/signin/',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignInPage() {
  return (
    <main className="page-shell account-page">
      <AccountPanel />
    </main>
  );
}
